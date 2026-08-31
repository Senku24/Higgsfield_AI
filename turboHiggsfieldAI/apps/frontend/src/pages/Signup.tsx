import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/config";
import { useState } from "react";
import axios from "axios"
import {  useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";



async function signup(username : string, password : string) {
    const response= await axios.post(`${BACKEND_URL}/api/v1/signup`, {
                username,
                password
            })
    return response.data
}

export function Signup() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const navigate = useNavigate();
    

    const mutation = useMutation({
        mutationFn : signup,
        onSuccess : () => {

        },
    })
    return (
        <div className="min-h-0 min-w-screen flex ">
            <div className= "flex-1 min-h-screen bg-black">
                
            </div>
            <div className= "flex-1 flex h-screen align-center justify-center">

                <div className= "flex flex-col gap-4 p-4 place-items-center justify-center ">
                    <div className="flex flex-col gap-2 border border-gray-300 rounded-md p-2">
                        <input placeholder= "username" type="text" onChange={(e) => setUsername(e.target.value)}></input>
                    </div>
                    <div className="flex flex-col gap-2 border border-gray-300 rounded-md p-2">
                        <input placeholder= "password" type="password" onChange={(e) => setPassword(e.target.value)} ></input>
                    </div>
                    <Button variant={"outline"} 
                    onClick={async () => {
                        try{
                            await mutation.mutate({username, password})
                            navigate("/signin")
                        } catch (error) {
                            console.error("Error during signup:", error)
                        }
                    } }
                    className=" flex align-center md:p-2 border border-gray-300 rounded-md p-2">
                        Signup
                    </Button>
                </div>

            </div>
        </div>
    )

}