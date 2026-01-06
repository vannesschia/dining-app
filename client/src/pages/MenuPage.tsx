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

type SwitchFieldProps = {
  label: string;
  id: string;
}

type RangeNumberFieldProps = {
  rangeKey: string;      // e.g., "calories"
  label: string;
  minName: string;
  maxName: string;

  error?: string | null;
  showError?: boolean;

  onTouched?: (rangeKey: string) => void;
  onValidate?: (rangeKey: string, form: HTMLFormElement) => void;

  inputClassName?: string;
  minPlaceholder?: string;
  maxPlaceholder?: string;
};

export function RangeNumberField({
  rangeKey,
  label,
  minName,
  maxName,
  error,
  showError = false,
  onTouched,
  onValidate,
  inputClassName = "border-[1.5px] border-neutral-400 rounded-lg py-1 px-2 w-full",
  minPlaceholder = "Min",
  maxPlaceholder = "Max",
}: RangeNumberFieldProps) {
  const invalid = Boolean(showError && error);

  return (
    <div className="w-full">
      <p className="text-fluid-base">{label}</p>

      {/* Use blur capture so we can validate when leaving either field */}
      <div
        className="flex gap-2 w-full"
        onBlurCapture={(e) => {
          const form = (e.target as HTMLElement).closest("form") as HTMLFormElement | null;
          if (!form) return;
          onTouched?.(rangeKey);
          onValidate?.(rangeKey, form);
        }}
      >
        <Form.Field name={minName} className="flex-1 min-w-0">
          <Form.Control asChild>
            <input
              type="number"
              min={0}
              step="any"
              inputMode="numeric"
              placeholder={minPlaceholder}
              aria-invalid={invalid}
              className={[
                inputClassName,
                invalid ? "border-red-500 focus-visible:ring-red-500" : "",
              ].join(" ")}
            />
          </Form.Control>
        </Form.Field>

        <Form.Field name={maxName} className="flex-1 min-w-0">
          <Form.Control asChild>
            <input
              type="number"
              min={0}
              step="any"
              inputMode="numeric"
              placeholder={maxPlaceholder}
              aria-invalid={invalid}
              className={[
                inputClassName,
                invalid ? "border-red-500 focus-visible:ring-red-500" : "",
              ].join(" ")}
            />
          </Form.Control>
        </Form.Field>
      </div>

      {showError && error ? (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      ) : null}
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
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const hid = Number(hallId);
  const period = mealPeriod as MealPeriod;

  const { data, isLoading } = useQuery({
    queryKey: ["meals", hid, period],
    queryFn: () =>
      fetch(`/api/menu?id=${hid}&meal_period=${period}`).then((r) => r.json()),
    enabled:
      Number.isFinite(hid) && ["breakfast", "lunch", "dinner"].includes(period),
  });

  let stations = new Map();
  for (let i = 0; i < data.length; i++) {
    if (!stations.has(data[i].station)) {
      stations.set(data[i].station, []);
    }
    stations.get(data[i].station).push(data[i]);
  }

  const dateInEST = new Date();
  const options: any = {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const formattedDate = dateInEST.toLocaleString("en-US", options);

  const RANGE_DEFS = {
    calories: { min: "caloriesMin", max: "caloriesMax" },
    protein: { min: "proteinMin", max: "proteinMax" },
    carbs: { min: "carbsMin", max: "carbsMax" },
    fats: { min: "fatsMin", max: "fatsMax" },
    sugar: { min: "sugarMin", max: "sugarMax" },
    sodium: { min: "sodiumMin", max: "sodiumMax" },
  } as const;

  function parseNum(v: FormDataEntryValue | null) {
    if (v == null) return null;
    const s = String(v).trim();
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function validateRange(min: number | null, max: number | null) {
    if (min != null && min < 0) return "Min cannot be negative.";
    if (max != null && max < 0) return "Max cannot be negative.";
    if (min != null && max != null && min > max) return "Min must be ≤ Max.";
    return null;
  }


  const validateOne = (rangeKey: string, form: HTMLFormElement) => {
    const def = RANGE_DEFS[rangeKey as keyof typeof RANGE_DEFS];
    if (!def) return;

    const fd = new FormData(form);
    const min = parseNum(fd.get(def.min));
    const max = parseNum(fd.get(def.max));

    const err = validateRange(min, max);
    setErrors((prev) => ({ ...prev, [rangeKey]: err }));
  };

  const validateAll = (form: HTMLFormElement) => {
    const nextErrors: Record<string, string | null> = {};
    for (const rangeKey of Object.keys(RANGE_DEFS)) {
      const def = RANGE_DEFS[rangeKey as keyof typeof RANGE_DEFS];
      const fd = new FormData(form);
      const min = parseNum(fd.get(def.min));
      const max = parseNum(fd.get(def.max));
      nextErrors[rangeKey] = validateRange(min, max);
    }
    setErrors(nextErrors);
    return nextErrors;
  };

  const focusFirstInvalid = (form: HTMLFormElement, nextErrors: Record<string, string | null>) => {
    for (const rangeKey of Object.keys(RANGE_DEFS)) {
      if (!nextErrors[rangeKey]) continue;
      const def = RANGE_DEFS[rangeKey as keyof typeof RANGE_DEFS];
      const el = form.elements.namedItem(def.min) as HTMLElement | null;
      el?.focus();
      break;
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    // Mark all as touched so errors become visible
    setTouched(Object.fromEntries(Object.keys(RANGE_DEFS).map((k) => [k, true])));

    const nextErrors = validateAll(form);
    const hasAnyError = Object.values(nextErrors).some(Boolean);

    if (hasAnyError) {
      focusFirstInvalid(form, nextErrors);
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    console.log("OK submit:", data);
  };

  if (isLoading) return null;
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
                      rangeKey="calories"
                      label="Calories (kcal)"
                      minName="caloriesMin"
                      maxName="caloriesMax"
                      error={errors.calories}
                      showError={Boolean(touched.calories)}
                      onTouched={(k) => setTouched((prev) => ({ ...prev, [k]: true }))}
                      onValidate={validateOne}
                    />
                    <RangeNumberField
                      rangeKey="protein"
                      label="Protein (g)"
                      minName="proteinMin"
                      maxName="proteinMax"
                      error={errors.protein}
                      showError={Boolean(touched.protein)}
                      onTouched={(k) => setTouched((prev) => ({ ...prev, [k]: true }))}
                      onValidate={validateOne}
                    />
                    <RangeNumberField
                      rangeKey="carbs"
                      label="Carbohydrates (g)"
                      minName="carbsMin"
                      maxName="carbsMax"
                      error={errors.carbs}
                      showError={Boolean(touched.carbs)}
                      onTouched={(k) => setTouched((prev) => ({ ...prev, [k]: true }))}
                      onValidate={validateOne}
                    />
                    <RangeNumberField
                      rangeKey="fats"
                      label="Fats (g)"
                      minName="fatsMin"
                      maxName="fatsMax"
                      error={errors.fats}
                      showError={Boolean(touched.fats)}
                      onTouched={(k) => setTouched((prev) => ({ ...prev, [k]: true }))}
                      onValidate={validateOne}
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
                              rangeKey="sugars"
                              label="Sugars (g)"
                              minName="sugarMin"
                              maxName="sugarMax"
                              error={errors.sugar}
                              showError={Boolean(touched.sugar)}
                              onTouched={(k) => setTouched((prev) => ({ ...prev, [k]: true }))}
                              onValidate={validateOne}
                            />
                            <RangeNumberField
                              rangeKey="sodium"
                              label="Sodium (mg)"
                              minName="sodiumMin"
                              maxName="sodiumMax"
                              error={errors.sodium}
                              showError={Boolean(touched.sodium)}
                              onTouched={(k) => setTouched((prev) => ({ ...prev, [k]: true }))}
                              onValidate={validateOne}
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
