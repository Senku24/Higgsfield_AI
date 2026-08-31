import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/config";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";


async function createAvatar(name: string, url: string) {
    const response = await axios.post(`${BACKEND_URL}/api/v1/avatar`, {
        name,
        image: url
    })
    return response.data
}
async function getAvatars() {
    const response = await axios.get(`${BACKEND_URL}/api/v1/avatar`)
    return response.data.avatars
} 

export function Dashboard() {
    const [avatarUrl, setAvatarUrl] = useState("");
    const [name, setName] = useState("");
    const [avatars, setAvatars] = useState([]);
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: ({ name, url }: { name: string; url: string }) => createAvatar(name, url),
        onSuccess: (data) => {
            queryClient.invalidateQueries({queryKey: ["avatars"]});
        },
    }); 
    const query = useQuery({
        queryKey: ["avatars"],
        queryFn: getAvatars
        
    })
    
    return (
        <div>
            Dashboard
            <div className="flex w-md p-4 border">
                <input placeholder="Avatar name" onChange ={ (e)=> setName(e.target.value) }></input>
                <input placeholder="url" onChange ={ (e)=> setAvatarUrl(e.target.value) }></input>
                <Button onClick = {async () => {
                    await mutation.mutate({name: name, url: avatarUrl})
                    
                }}>
                    create avatar
                </Button>
            </div>
            <div>
                <b>Avatar's</b>
                {query.data?.map((avatar: any) => (
                    <div key={avatar.id}>
                        <div>{avatar.name}</div>
                        <img src={avatar.image} alt={avatar.name} />
                    </div>
                ))}
            </div>
        </div>
    )

}