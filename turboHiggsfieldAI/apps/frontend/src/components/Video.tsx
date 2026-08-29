



export function Video({url, title}: {url: string, title: string}) {
    return (
        <div className = "p-4 rounded m-4 bg-black text-white text-xl">
            <div>
                <video src={url} autoPlay muted className="w-full h-50" />
            </div>
       
            <div className = "text-white  ">
                {title}
            </div>
        </div>
    )
}