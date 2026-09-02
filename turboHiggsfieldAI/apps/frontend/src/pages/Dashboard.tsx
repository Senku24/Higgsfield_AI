import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "../lib/api";

export function Dashboard() {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get("/api/v1/me");
      return res.data;
    },
  });

  const { data: avatarsData, isLoading } = useQuery({
    queryKey: ["avatars"],
    queryFn: async () => {
      const res = await api.get("/api/v1/avatars");
      return res.data.avatars || [];
    },
    refetchInterval: (query) => {
      // Auto-poll if any avatar is in Pending status
      const hasPending = query.state.data?.some((a: any) => a.status === "Pending");
      return hasPending ? 3000 : false;
    },
  });

  const createAvatarMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      const res = await api.post("/api/v1/avatar", {
        name,
        image: imageUrl,
      });
      return res.data;
    },
    onSuccess: () => {
      setName("");
      setImageUrl("");
      queryClient.invalidateQueries({ queryKey: ["avatars"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to create avatar");
    },
  });

  return (
    <div className="min-h-[calc(100vh-60px)] bg-slate-950 text-slate-100 p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold">Soul ID — Avatar Manager</h1>
          <p className="text-slate-400 text-sm mt-1">
            Create multi-angle profile avatars (10 credits per avatar) to use in Video Studio
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-sm text-slate-300">
          Balance: <span className="font-bold text-amber-400">{user?.creditBalance ?? 0} Credits</span>
        </div>
      </div>

      {/* Creation Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-amber-400 flex items-center gap-2">
          <span>✨</span> Create New Soul ID Avatar
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-slate-300">Avatar Name</Label>
            <Input
              placeholder="e.g. Cyberpunk Hero"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 bg-slate-950 border-slate-800"
            />
          </div>
          <div>
            <Label className="text-slate-300">Reference Image URL</Label>
            <Input
              placeholder="https://example.com/character.png"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-1 bg-slate-950 border-slate-800"
            />
          </div>
        </div>

        <Button
          onClick={() => createAvatarMutation.mutate()}
          disabled={createAvatarMutation.isPending || !name || !imageUrl || (user?.creditBalance ?? 0) < 10}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
        >
          {createAvatarMutation.isPending ? "Generating Headshots..." : "Create Avatar (Cost: 10 Credits)"}
        </Button>
        {(user?.creditBalance ?? 0) < 10 && (
          <span className="text-xs text-red-400 ml-3">Insufficient credits (Need 10 credits)</span>
        )}
      </div>

      {/* Avatars List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Soul ID Avatars</h2>
        {isLoading ? (
          <div className="text-slate-400 text-sm">Loading avatars...</div>
        ) : avatarsData?.length === 0 ? (
          <div className="text-slate-500 text-sm bg-slate-900/50 p-6 rounded-lg border border-slate-800 text-center">
            No avatars created yet. Create your first avatar above!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {avatarsData?.map((avatar: any) => (
              <div key={avatar.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-slate-100">{avatar.name}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      avatar.status === "Done"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : avatar.status === "Error"
                        ? "bg-red-500/10 text-red-400 border border-red-500/30"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse"
                    }`}
                  >
                    {avatar.status || "Pending"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  {avatar.avatarImages && avatar.avatarImages.length > 0 ? (
                    avatar.avatarImages.map((img: any) => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.url}
                          alt={avatar.name}
                          className="w-full h-24 object-cover rounded-lg border border-slate-800"
                        />
                        <span className="absolute bottom-1 right-1 text-[10px] bg-black/70 text-slate-300 px-1 rounded">
                          {img.type}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-xs text-slate-500 italic py-4 text-center">
                      Processing headshots...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}