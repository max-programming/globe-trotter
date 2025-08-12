import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "~/components/ui/carousel";
import { Card, CardContent } from "~/components/ui/card";
import Autoplay from "embla-carousel-autoplay";

export function Example() {
  return (
    <Carousel
      plugins={[
        Autoplay({
          delay: 2000,
        }),
      ]}
    >
      // ...
    </Carousel>
  );
}

const bannerImages = [
  "/images/banner-1.jpg",
  "/images/banner-2.jpg",
  "/images/banner-3.jpg",
  "/images/banner-4.jpg",
];

function BannerSlider() {
  return (
    <div className="relative w-full">
      <Carousel
        className="w-full"
        opts={{
          loop: true,
          align: "start",
        }}
        plugins={[Autoplay({ delay: 2000 })]}
      >
        <CarouselContent className="-ml-0">
          {bannerImages.map((image, index) => (
            <CarouselItem key={index} className="pl-0">
              <Card className="border-0 shadow-none py-0">
                <CardContent className="p-0">
                  <div className="relative w-full h-[500px] overflow-hidden">
                    <img
                      src={image}
                      alt={`Banner ${index + 1}`}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="container px-4 mx-auto h-full flex items-end">
          <div className="text-white pb-4">
            <h2 className="text-2xl font-bold mb-2">
              Discover Amazing Destinations
            </h2>
            <p className="text-lg opacity-90">
              Experience the world like never before
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BannerSlider;
