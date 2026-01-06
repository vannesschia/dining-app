import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Tabs, Accordion, Form, Switch } from "radix-ui";
import {
  ChevronRight,
  BananaIcon,
  ArrowLeft,
  ArrowDown,
  Info,
  ArrowUpRight,
} from "lucide-react";
import { capitalizeFirstLetter } from "../lib/utils";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { Link } from "react-router-dom";
import { useState } from "react";

type RangeNumberFieldProps = {
  label: string;
  minName: string;
  maxName: string;
  className?: string;
  inputClassName?: string;
  minPlaceholder?: string;
  maxPlaceholder?: string;
};

type SwitchFieldProps = {
  label: string;
  id: string;
}

export function RangeNumberField({
  label,
  minName,
  maxName,
  inputClassName = "border-[1.5px] border-neutral-400 rounded-lg py-1 px-2 w-full",
  minPlaceholder = "Min",
  maxPlaceholder = "Max",
}: RangeNumberFieldProps) {
  return (
    <div className="w-full">
      <p className="text-fluid-base">{label}</p>

      <div className="flex gap-2 w-full">
        <Form.Field name={minName} className="flex-1 min-w-0">
          <Form.Control asChild>
            <input
              type="number"
              placeholder={minPlaceholder}
              className={inputClassName}
              min={0}
              step="any"
              inputMode="numeric"
            />
          </Form.Control>
        </Form.Field>

        <Form.Field name={maxName} className="flex-1 min-w-0">
          <Form.Control asChild>
            <input
              type="number"
              placeholder={maxPlaceholder}
              className={inputClassName}
            />
          </Form.Control>
        </Form.Field>
      </div>
    </div>
  );
}

export function SwitchField({label, id}: SwitchFieldProps) {
  const [checked, setChecked] = useState(false);

  return(
    <div className="flex items-center gap-2 w-full justify-between">
      <label
        htmlFor={id}
        className="text-fluid-base cursor-pointer"
      >
        {label}
      </label>
      <input type="hidden" name={id} value={checked ? "true" : "false"} />
      <Switch.Root
        id={id}
        className="
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer
          items-center rounded-full
          bg-neutral-300
          transition-colors
          data-[state=checked]:bg-neutral-900
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-neutral-900
          focus-visible:ring-offset-2
        "
        checked={checked}
        onCheckedChange={setChecked}
      >
        <Switch.Thumb
          className="
            pointer-events-none block h-5 w-5 rounded-full bg-white
            shadow
            transition-transform
            translate-x-0.5
            data-[state=checked]:translate-x-5
          "
        />
      </Switch.Root>
    </div>
  )
}

// export function AccordionContent(props: React.ComponentProps<typeof Accordion.Content>) {
//   return <Accordion.Content {...props} />;
// }

type MealPeriod = "breakfast" | "lunch" | "dinner";

function MenuPage() {
  const location = useLocation();
  const hallId = location.state.id;
  const { hallName, mealPeriod } = useParams();
  // console.log(hallId)
  // console.log(mealPeriod)

  const hid = Number(hallId);
  const period = mealPeriod as MealPeriod;

  const { data, isLoading } = useQuery({
    queryKey: ["meals", hid, period],
    queryFn: () =>
      fetch(`/api/menu?id=${hid}&meal_period=${period}`).then((r) => r.json()),
    enabled:
      Number.isFinite(hid) && ["breakfast", "lunch", "dinner"].includes(period),
  });

  if (isLoading) return null;

  // console.log(data)
  let stations = new Map();
  // console.log(data.length)
  for (let i = 0; i < data.length; i++) {
    if (!stations.has(data[i].station)) {
      stations.set(data[i].station, []);
    }
    stations.get(data[i].station).push(data[i]);
  }
  console.log(stations);

  const dateInEST = new Date();
  const options: any = {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const formattedDate = dateInEST.toLocaleString("en-US", options);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    console.log(data);
  };


  return (
    <div className="min-h-screen bg-dot-grid">
      <div className="mx-auto min-w-60 max-w-4xl px-6 sm:px-12 md:px-24 py-10">
        <div className="flex flex-col gap-8">
          <div>
            <Link to="/">
              <Button scheme="dark">
                <ArrowLeft className="h-[1em] w-[1em]" />
                Back
              </Button>
            </Link>
          </div>
          <div>
            <div className="flex gap-1 items-center flex-wrap leading-none text-fluid-3xl tracking-tight">
              <BananaIcon className="w-[1em] h-[1em] text-yellow-500" />
              <h1 className="font-bold">{capitalizeFirstLetter(hallName!)}</h1>
              {/* <ChevronRight className="w-[1em] h-[1em]" /> */}
            </div>
            <div className="flex gap-1 items-center flex-wrap leading-none text-fluid-xl tracking-tight mt-2">
              <h1>{capitalizeFirstLetter(mealPeriod!)}</h1>
              <ChevronRight className="w-[1em] h-[1em]" />
              <h1 className="font-mono tracking-tighter">{formattedDate}</h1>
            </div>
          </div>
          <Tabs.Root defaultValue="optimize" className="flex flex-col gap-4">
            <Tabs.List className="flex border-neutral-300 border-[1.5px] shrink w-fit py-1 px-1 rounded-lg gap-1 bg-conic-[from_270deg,white_0%,rgba(255,255,255,0.50)_50%,rgba(255,255,255,0)_75%,white_100%]">
              <Tabs.Trigger
                value="optimize"
                className="px-3 rounded-lg tab-trigger btn-dark"
              >
                Generate Meals
              </Tabs.Trigger>
              <Tabs.Trigger
                value="menu"
                className="px-3 rounded-lg tab-trigger btn-dark"
              >
                View Menu
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="optimize">
              <div className="border-[1.5px] border-neutral-300 rounded-lg p-4 bg-conic-[from_270deg,white_0%,rgba(255,255,255,0.50)_50%,rgba(255,255,255,0)_75%,white_100%]">
                <div className="text-fluid-sm text-neutral-600 flex gap-2 items-start">
                  <Info className="h-[1em] w-[1em] mt-1" />
                  <p>
                    Don't know your macros? Use a&nbsp;
                    <a
                      className="inline-flex items-center underline decoration-dotted underline-offset-4"
                      href={"https://www.calculator.net/tdee-calculator.html"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      TDEE Calculator
                      <ArrowUpRight className="h-[1em] w-[1em] inline align-baseline" />
                    </a>
                    .
                  </p>
                </div>
                <div>
                  <Form.Root className="flex flex-col gap-2 mt-4" onSubmit={(event) => handleSubmit(event)}>
                    <RangeNumberField
                      label="Calories (kcal)"
                      minName="caloriesMin"
                      maxName="caloriesMax"
                    />
                    <RangeNumberField
                      label="Protein (g)"
                      minName="proteinMin"
                      maxName="proteinMax"
                    />
                    <RangeNumberField
                      label="Carbohydrates (g)"
                      minName="carbsMin"
                      maxName="carbsMax"
                    />
                    <RangeNumberField
                      label="Fats (g)"
                      minName="fatsMin"
                      maxName="fatsMax"
                    />

                    <Accordion.Root type="multiple">
                      <Accordion.Item value="advanced">
                        <Accordion.AccordionTrigger
                          className="
                            text-left text-fluid-lg w-fit
                            [&[data-state=open]_svg]:rotate-180
                          "
                        >
                          <div className="text-fluid-sm flex items-center gap-1">
                            <p>More Macros</p>
                            <ArrowDown
                              className="
                                h-[1em] w-[1em]
                                transition-transform duration-200 ease-out
                                "
                            />
                          </div>
                        </Accordion.AccordionTrigger>
                        <Accordion.Content forceMount className="accordion-content overflow-hidden data-[state=closed]:h-0 data-[state=open]:h-(--radix-accordion-content-height)">
                          <div className="flex flex-col gap-2 mt-1 mb-3">
                            <RangeNumberField
                              label="Sugars (g)"
                              minName="sugarMin"
                              maxName="sugarMax"
                            />
                            <RangeNumberField
                              label="Sodium (mg)"
                              minName="sodiumMin"
                              maxName="sodiumMax"
                            />
                          </div>
                        </Accordion.Content>
                      </Accordion.Item>
                      <Accordion.Item value="diet">
                        <Accordion.AccordionTrigger
                          className="
                            text-left text-fluid-lg w-fit
                            [&[data-state=open]_svg]:rotate-180
                          "
                        >
                          <div className="text-fluid-sm flex items-center gap-1">
                            <p>Dietary Constraints</p>
                            <ArrowDown
                              className="
                                h-[1em] w-[1em]
                                transition-transform duration-200 ease-out
                                "
                            />
                          </div>
                        </Accordion.AccordionTrigger>
                        <Accordion.Content forceMount className="accordion-content overflow-hidden data-[state=closed]:h-0 data-[state=open]:h-(--radix-accordion-content-height)">
                          <div className="flex flex-col gap-3 my-1">
                            <SwitchField label="Vegan" id="vegan"/>
                            <SwitchField label="Halal" id="halal"/>
                            <SwitchField label="Gluten-Free" id="gluten-free"/>
                          </div>
                        </Accordion.Content>
                      </Accordion.Item>
                    </Accordion.Root>
                    <div className="text-right">
                      <Form.Submit asChild>
                        <Button scheme="dark" className="px-4 mt-2">
                          Generate
                        </Button>
                      </Form.Submit>
                    </div>
                  </Form.Root>
                </div>
              </div>
            </Tabs.Content>
            <Tabs.Content value="menu">
              <div className="flex flex-col gap-4">
                {[...stations.keys()].map((stationName) => {
                  return (
                    <div
                      key={stationName}
                      className="border-[1.5px] border-neutral-300 rounded-lg p-4 bg-conic-[from_270deg,white_0%,rgba(255,255,255,0.50)_50%,rgba(255,255,255,0)_75%,white_100%]"
                    >
                      <h2 className="text-fluid-xl font-bold mb-2 tracking-tight leading-none">
                        {stationName}
                      </h2>
                      <Accordion.Root type="single" collapsible>
                        {[...stations.get(stationName)].map((items) => {
                          return (
                            <Accordion.Item
                              value={items.id}
                              className="border-b border-neutral-400 w-full"
                            >
                              <Accordion.AccordionTrigger
                                className="
                                  text-left text-fluid-lg py-1.5 w-full
                                  [&[data-state=open]_svg]:rotate-180
                                "
                              >
                                <div className="flex justify-between items-center">
                                  {items.name}
                                  <ArrowDown
                                    className="
                                      h-[1em] w-[1em]
                                      transition-transform duration-200 ease-out
                                    "
                                  />
                                </div>
                              </Accordion.AccordionTrigger>

                              <Accordion.Content className="accordion-content overflow-hidden">
                                <div className="pb-4">
                                  <div className="text-fluid-base mt-2 flex flex-col gap-1">
                                    <div className="flex justify-between">
                                      <p>Portion Size</p>
                                      <p className="font-mono">
                                        {items.portion_size}
                                      </p>
                                    </div>
                                    <div className="flex justify-between">
                                      <p>Serving Size</p>
                                      {/* <hr className="grow border-t border-line mx-2 self-center" /> */}
                                      <p className="font-mono">
                                        {items.serving_size_g}g
                                      </p>
                                    </div>
                                    <div className="flex justify-between">
                                      <p>Calories</p>
                                      <p className="font-mono">
                                        {items.calories_kcal}kcal
                                      </p>
                                    </div>
                                    <div className="flex justify-between">
                                      <p>Protein</p>
                                      <p className="font-mono">
                                        {items.protein_g}g
                                      </p>
                                    </div>
                                    <div className="flex justify-between">
                                      <p>Total Carbohydrates</p>
                                      <p className="font-mono">
                                        {items.total_carbohydrate_g}g
                                      </p>
                                    </div>
                                    <div className="flex justify-between">
                                      <p>Total Fat</p>
                                      <p className="font-mono">
                                        {items.total_fat_g}g
                                      </p>
                                    </div>
                                    <div className="flex justify-between">
                                      <p>Saturated Fat</p>
                                      <p className="font-mono">
                                        {items.saturated_fat_g}g
                                      </p>
                                    </div>
                                    <div className="flex justify-between">
                                      <p>Trans Fat</p>
                                      <p className="font-mono">
                                        {items.trans_fat_g}g
                                      </p>
                                    </div>
                                    <div className="flex justify-between">
                                      <p>Sugars</p>
                                      <p className="font-mono">
                                        {items.sugars_g}g
                                      </p>
                                    </div>
                                    <div className="flex justify-between">
                                      <p>Sodium</p>
                                      <p className="font-mono">
                                        {items.sodium_mg}mg
                                      </p>
                                    </div>
                                    <div className="flex justify-between">
                                      <p>Dietary Fiber</p>
                                      <p className="font-mono">
                                        {items.dietary_fiber_g}g
                                      </p>
                                    </div>
                                    <div className="flex justify-between">
                                      <p>Cholesterol</p>
                                      <p className="font-mono">
                                        {items.cholesterol_mg}mg
                                      </p>
                                    </div>
                                  </div>
                                  <div className="inline-flex flex-wrap gap-2 min-w-0 text-wrap mt-4">
                                    {items.traits.map((trait: string) => {
                                      return (
                                        <Badge className="" color="lime">
                                          {trait}
                                        </Badge>
                                      );
                                    })}
                                    {items.allergens.map((trait: string) => {
                                      return (
                                        <Badge className="" color="red">
                                          {capitalizeFirstLetter(trait)}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                </div>
                              </Accordion.Content>
                            </Accordion.Item>
                          );
                        })}
                      </Accordion.Root>
                    </div>
                  );
                })}
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>
    </div>
  );
}

export default MenuPage;

{
  /* <Form.Field className="" name="calories">
  <div>
    <Form.Label className="text-fluid-base">
      Calories (kcal)
    </Form.Label>
  </div>
  <div className="flex gap-2">
    <Form.Control asChild>
      <input
        className="border-[1.5px] border-neutral-400 rounded-lg py-1 px-2 w-full"
        type="number"
        placeholder="Min"
      />
    </Form.Control>
    <Form.Control asChild>
      <input
        className="border-[1.5px] border-neutral-400 rounded-lg py-1 px-2 w-full"
        type="number"
        placeholder="Max"
      />
    </Form.Control>
  </div>
</Form.Field>

<Form.Field className="" name="protein">
  <div>
    <Form.Label className="text-fluid-base">
      Protein (g)
    </Form.Label>
  </div>
  <div className="flex gap-2">
    <Form.Control asChild>
      <input
        className="border-[1.5px] border-neutral-400 rounded-lg py-1 px-2 w-full"
        type="number"
        placeholder="Min"
      />
    </Form.Control>
    <Form.Control asChild>
      <input
        className="border-[1.5px] border-neutral-400 rounded-lg py-1 px-2 w-full"
        type="number"
        placeholder="Max"
      />
    </Form.Control>
  </div>
</Form.Field>

<Form.Field className="" name="carbohydrates">
  <div>
    <Form.Label className="text-fluid-base">
      Carbohydrates (g)
    </Form.Label>
  </div>
  <div className="flex gap-2">
    <Form.Control asChild>
      <input
        className="border-[1.5px] border-neutral-400 rounded-lg py-1 px-2 w-full"
        type="number"
        placeholder="Min"
      />
    </Form.Control>
    <Form.Control asChild>
      <input
        className="border-[1.5px] border-neutral-400 rounded-lg py-1 px-2 w-full"
        type="number"
        placeholder="Max"
      />
    </Form.Control>
  </div>
</Form.Field>

<Form.Field className="" name="fats">
  <div>
    <Form.Label className="text-fluid-base">
      Fats (g)
    </Form.Label>
  </div>
  <div className="flex gap-2">
    <Form.Control asChild>
      <input
        className="border-[1.5px] border-neutral-400 rounded-lg py-1 px-2 w-full"
        type="number"
        placeholder="Min"
      />
    </Form.Control>
    <Form.Control asChild>
      <input
        className="border-[1.5px] border-neutral-400 rounded-lg py-1 px-2 w-full"
        type="number"
        placeholder="Max"
      />
    </Form.Control>
  </div>
</Form.Field> */
}
