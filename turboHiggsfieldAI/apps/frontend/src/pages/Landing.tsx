import { Video } from "../components/Video";
import { Carousel, CarouselContent, 
    CarouselItem, CarouselNext, CarouselPrevious } from "../components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

export function LandingPage() {
    const plugin = useRef(
    Autoplay({
      delay: 3000, // 3 seconds
      stopOnInteraction: false,
    })
    );
    return (
        <div className="w-full px-12 min-h-screen min-w-screen bg-black" >
            <Carousel opts={{align: "start", loop: true, }} plugins={[plugin.current]} className="w-full ">
                
                    <CarouselContent>
                        <CarouselItem className= "basis-1/3">
                            <Video url="https://cdn.higgsfield.ai/card/5ca917b5-c2aa-4bcb-b43c-2b209440e3e4.mp4" title="Video 1" />
                        </CarouselItem>

                        <CarouselItem className= "basis-1/3">
                            <Video url="https://cdn.higgsfield.ai/card/2660545e-5ebf-4c42-9f48-c457ff5b15af.mp4" title="Video 2" />
                        </CarouselItem>

                        <CarouselItem className= "basis-1/3">
                            <Video url="https://cdn.higgsfield.ai/card/5ca917b5-c2aa-4bcb-b43c-2b209440e3e4.mp4" title="Video 3" />
                        </CarouselItem>

                        <CarouselItem className= "basis-1/3">
                            <Video url="https://cdn.higgsfield.ai/card/2660545e-5ebf-4c42-9f48-c457ff5b15af.mp4" title="Video 4 " />
                        </CarouselItem>
                        <CarouselItem className= "basis-1/3">
                            <Video url="https://cdn.higgsfield.ai/card/2660545e-5ebf-4c42-9f48-c457ff5b15af.mp4" title="Video 4 " />
                        </CarouselItem>
                    </CarouselContent>
                    
                <CarouselPrevious className="left-0.5"/>
                <CarouselNext  className="right-0.5"/>
            </Carousel>
        </div>
    )

}