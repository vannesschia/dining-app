import "./App.css";
import { BananaIcon } from "lucide-react";
import Button from "./components/Button";
import Badge from "./components/Badge";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./lib/api";
import { NavLink } from "react-router-dom";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { CornerDownLeft } from "lucide-react";
import { API_BASE } from "./lib/api";

type MealPeriod = "breakfast" | "lunch" | "dinner";

type DiningHall = {
  id: number;
  name: string;
  meals_today?: MealPeriod[];
};

function titleCase(p: string) {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export default function App() {
  const [selectedHall, setSelectedHall] = useState<DiningHall | null>(null);
  // const [selectedPeriod, setSelectedPeriod] = useState<MealPeriod | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["dining-halls"],
    queryFn: () => apiGet<DiningHall[]>(`${API_BASE}/get-dining-halls`),
  });
  console.log(data)
  console.log(data?.filter(dhall => dhall.meals_today?.length))

  const step: "hall" | "period" = selectedHall ? "period" : "hall";

  const availablePeriods: MealPeriod[] = useMemo(() => {
    if (!selectedHall) return [];
    if (selectedHall.meals_today?.length) return selectedHall.meals_today;
    return ["breakfast", "lunch", "dinner"];
  }, [selectedHall]);
  
  function goBackOne() {
    // setSelectedPeriod(null);
    setSelectedHall(null);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dot-grid flex flex-col items-center gap-8 pt-20 md:pt-40">
        <div className="mx-auto w-fit mb-16">
          <div className="flex items-center justify-center gap-1 text-fluid-4xl tracking-tight leading-tight">
            <BananaIcon className="w-[1em] h-[1em] text-yellow-500" />
            <h1 className="font-bold">FuelStack</h1>
          </div>

          <div className="flex justify-between gap-2 items-end text-black">
            <p className="text-fluid-lg max-w-[clamp(15ch,25vw,25ch)] text-balance leading-none">
              Plan your meals in an instant @ <span className="font-umich leading-none">M</span>
            </p>
            <Button scheme="dark">
              <NavLink to="/about" end>
                Learn More
              </NavLink>
            </Button>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-[2em] h-[2em] border-2 border-black border-t-transparent rounded-full animate-spin mr-1"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dot-grid flex flex-col items-center gap-8 pt-20 md:pt-40">
      <div className="mx-auto w-fit mb-16">
        <div className="flex items-center justify-center gap-1 text-fluid-4xl tracking-tight leading-tight">
          <BananaIcon className="w-[1em] h-[1em] text-yellow-500" />
          <h1 className="font-bold">FuelStack</h1>
        </div>

        <div className="flex justify-between gap-2 items-end text-black">
          <p className="text-fluid-lg max-w-[clamp(15ch,25vw,25ch)] text-balance leading-none">
            Plan your meals in an instant @ <span className="font-umich leading-none">M</span>
          </p>
          <Button scheme="dark">
            <NavLink to="/about" end>
              Learn More
            </NavLink>
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          {step === "period" && (
            <div className="flex gap-2" onClick={goBackOne}>
              <Badge className="justify-center cursor-pointer" color="neutral">
                <CornerDownLeft className="h-4 w-4"/>
              </Badge>
            </div>
          )}
          <Badge color="amber">
            {step === "hall" ? "Where are we dining today?" : "What time is it?"}
          </Badge>
        </div>
        {step === "period" && selectedHall && (
          <Badge color="lime">
            Selected: <span className="font-semibold">{selectedHall.name}</span>
          </Badge>
        )}
      </div>

      <div className="w-full max-w-4xl lg:px-0 md:px-36 px-16 pb-20 md:pb-0">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(225px,1fr))] gap-4">
          {step === "hall" &&
            data?.filter(dhall => dhall.meals_today?.length).map((dhall) => (
              <Button
                key={dhall.id}
                className="w-full justify-center py-6 font-bold"
                onClick={() => {
                  setSelectedHall(dhall);
                }}
                scheme="light"
              >
                {dhall.name}
              </Button>
            ))}

          {step === "period" &&
            availablePeriods.map((p) => (
              <Link key={p} to={`/menu/${selectedHall!.name.toLowerCase()}/${p}`} state={{id: selectedHall!.id}}>
                <Button
                  className="w-full justify-center py-6 font-bold"
                  scheme="light"
                >
                  {titleCase(p)}
                </Button>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
