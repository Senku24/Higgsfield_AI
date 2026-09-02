import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "../lib/api";

export function VideoCreator() {
  const [prompt, setPrompt] = useState("");
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>("");
  const [duration, setDuration] = useState(8);
  const [resolution, setResolution] = useState("1024x1024");
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get("/api/v1/me");
      return res.data;
    },
  });

  const { data: avatars } = useQuery({
    queryKey: ["avatars"],
    queryFn: async () => {
      const res = await api.get("/api/v1/avatars");
      return res.data.avatars || [];
    },
  });

  const { data: videosData, isLoading: isLoadingVideos } = useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      const res = await api.get("/api/v1/videos");
      return res.data.videos || [];
    },
    refetchInterval: (query) => {
      const hasPending = query.state.data?.some((v: any) => v.status === "Pending");
      return hasPending ? 4000 : false;
    },
  });

  const createVideoMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      const [width, height] = resolution.split("x").map(Number);
      const res = await api.post("/api/v1/video", {
        prompt,
        avatarIds: selectedAvatarId ? [selectedAvatarId] : [],
        duration,
        width,
        height,
      });
      return res.data;
    },
    onSuccess: () => {
      setPrompt("");
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to submit video generation");
    },
  });

  return (
    <div className="min-h-[calc(100vh-60px)] bg-slate-950 text-slate-100 p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold">Video Studio — Camera & AI Controls</h1>
          <p className="text-slate-400 text-sm mt-1">
            Generate cinematic AI videos powered by Google Veo 3.1 with camera control (35 credits per video)
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-sm text-slate-300">
          Balance: <span className="font-bold text-amber-400">{user?.creditBalance ?? 0} Credits</span>
        </div>
      </div>

      {/* Video Generation Studio Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
        <h2 className="text-xl font-semibold text-amber-400 flex items-center gap-2">
          <span>🎬</span> Create Video Prompt & Camera Params
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <Label className="text-slate-300 mb-1 block">Cinematic Prompt</Label>
          <Textarea
            rows={4}
            placeholder="e.g. Medium eye-level shot of character walking confidently through a sun-drenched lagoon in a pink feather dress, cinematic lighting, slow pull-back camera motion..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="bg-slate-950 border-slate-800 text-slate-100"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-slate-300 mb-1 block">Soul ID Avatar Reference</Label>
            <Select value={selectedAvatarId} onValueChange={setSelectedAvatarId}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                <SelectValue placeholder="Select Soul ID Avatar" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                <SelectItem value="none">None (Text-only)</SelectItem>
                {avatars?.map((avatar: any) => (
                  <SelectItem key={avatar.id} value={avatar.id}>
                    {avatar.name} ({avatar.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-300 mb-1 block">Duration (Seconds)</Label>
            <Select value={String(duration)} onValueChange={(val) => setDuration(Number(val))}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                <SelectValue placeholder="Select Duration" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                <SelectItem value="5">5 Seconds</SelectItem>
                <SelectItem value="8">8 Seconds (Default)</SelectItem>
                <SelectItem value="12">12 Seconds</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-300 mb-1 block">Resolution & Aspect Ratio</Label>
            <Select value={resolution} onValueChange={setResolution}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                <SelectValue placeholder="Select Resolution" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                <SelectItem value="1024x1024">1024x1024 (1:1 Square)</SelectItem>
                <SelectItem value="1280x720">1280x720 (16:9 Landscape)</SelectItem>
                <SelectItem value="720x1280">720x1280 (9:16 Portrait)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            onClick={() => createVideoMutation.mutate()}
            disabled={createVideoMutation.isPending || !prompt || (user?.creditBalance ?? 0) < 35}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-6 py-2 rounded-lg"
          >
            {createVideoMutation.isPending ? "Queuing Video Job..." : "Generate Video (Cost: 35 Credits)"}
          </Button>

          {(user?.creditBalance ?? 0) < 35 && (
            <span className="text-xs text-red-400 font-medium">
              Insufficient credits to generate video (Need 35 credits)
            </span>
          )}
        </div>
      </div>

      {/* Generated Videos Gallery */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Video Studio Gallery</h2>
        {isLoadingVideos ? (
          <div className="text-slate-400 text-sm">Loading gallery...</div>
        ) : videosData?.length === 0 ? (
          <div className="text-slate-500 text-sm bg-slate-900/50 p-6 rounded-lg border border-slate-800 text-center">
            No videos generated yet. Create your first video above!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videosData?.map((video: any) => (
              <div key={video.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-xs text-slate-300 font-mono line-clamp-2">{video.prompt}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                      video.status === "Done"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : video.status === "Error"
                        ? "bg-red-500/10 text-red-400 border border-red-500/30"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse"
                    }`}
                  >
                    {video.status || "Pending"}
                  </span>
                </div>

                {video.status === "Done" && video.videoUrl ? (
                  <video src={video.videoUrl} controls className="w-full rounded-lg border border-slate-800" />
                ) : video.status === "Error" ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                    Failed: {video.errorMessage || "Generation failed at model provider"}
                  </div>
                ) : (
                  <div className="h-48 bg-slate-950 border border-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs">Processing video with Veo 3.1 model...</span>
                  </div>
                )}

                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>
                    Resolution: {video.width}x{video.height} ({video.duration}s)
                  </span>
                  <span>Cost: {video.costCredits} credits</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}