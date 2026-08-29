import { useNavigate } from "react-router";
import { Button } from "./ui/button";

export function Appbar() {
    const navigate = useNavigate();
  return (
    <div>
        <div className= "bg-black text-amber-200 flex justify-between  ">
            <div className= "p-4 font-bold">
                Higgsfield
            </div>
            <div className= "flex gap-2 p-4">
                <Button variant={"outline"} className=" flex align-center p-2 md:p-2" onClick={() => navigate("/signup")}>signup</Button>
                <Button variant={"outline"} className=" flex align-center p-2 md:p-2" onClick={() => navigate("/signin")}>sign in</Button>
            </div>
        </div>
    </div>
  );
}