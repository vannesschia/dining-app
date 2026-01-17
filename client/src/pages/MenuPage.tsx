import { useParams, useLocation } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, Accordion, Form, Switch } from "radix-ui";
import {
  ChevronRight,
  BananaIcon,
  ArrowLeft,
  ArrowDown,
  Info,
  ArrowUpRight,
  ShieldAlert,
  TriangleAlert
} from "lucide-react";
import { capitalizeFirstLetter } from "../lib/utils";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { API_BASE } from "../lib/api";

type SwitchFieldProps = {
  label: string;
  id: string;
}

type RangeNumberFieldProps = {
  rangeKey: string;
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

  isRequired?: boolean;
};

type OptimizeResponse = {
  received: any;
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
  isRequired = false,
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
              required={isRequired}
            />
          </Form.Control>
          <Form.Message match="valueMissing">
            <div className="flex gap-1 items-center text-red-800">
              <TriangleAlert className="h-[0.8em] w-[0.8em]"/>
              <p className="text-fluid-sm">
                Required!
              </p>
            </div>
          </Form.Message>
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
              required={isRequired}
            />
          </Form.Control>
          <Form.Message match="valueMissing">
            <div className="flex gap-1 items-center text-red-800">
              <TriangleAlert className="h-[0.8em] w-[0.8em]"/>
              <p className="text-fluid-sm">
                Required!
              </p>
            </div>
          </Form.Message>
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
      <input type="hidden" name="traits[]" value={label} disabled={!checked}/>
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

  const optimizeMutation = useMutation({
    mutationFn: (payload: any) =>
      postJSON<OptimizeResponse>(`${API_BASE}/optimize-meal`, payload),
  });

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["meals", hid, period],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/menu?id=${hid}&meal_period=${period}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      return res.json();
    },
    enabled:
      Number.isFinite(hid) && ["breakfast", "lunch", "dinner"].includes(period),
  });

  const allergens = new Set<string>();
  data.forEach((item: any) => {
    // Ensure item.allergens is an array before iterating
    if (Array.isArray(item.allergens)) {
      item.allergens.forEach((allergen: string) => {
        if (allergen) {
          allergens.add(String(allergen).trim());
        }
      });
    }
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
    calories: { min: "calories_min", max: "calories_max" },
    protein: { min: "protein_min", max: "protein_max" },
    carbs: { min: "carb_min", max: "carb_max" },
    fats: { min: "fat_min", max: "fat_max" },
    sugar: { min: "sugars_min", max: "sugars_max" },
    sodium: { min: "sodium_min", max: "sodium_max" },
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

  async function postJSON<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      return res.json() as Promise<T>;
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    setTouched(Object.fromEntries(Object.keys(RANGE_DEFS).map((k) => [k, true])));

    const nextErrors = validateAll(form);
    const hasAnyError = Object.values(nextErrors).some(Boolean);

    if (hasAnyError) {
      focusFirstInvalid(form, nextErrors);
      return;
    }

    const fd = new FormData(form);
    const allergens = fd.getAll("allergens[]") as string[];
    const traits = fd.getAll("traits[]") as string[];
    const scalars: Record<string, number | null> = {};

    for (const [key, value] of fd.entries()) {
      if (key === "allergens[]" || key === "traits[]") continue;
      const v = String(value).trim();
      if (v === "") {
        scalars[key] = null;
        continue;
      }
      const n = Number(v);
      scalars[key] = Number.isFinite(n) ? n : null;
    }

    const payload = {
      dining_hall_id: hid,
      meal_period: period,

      ...scalars,
      allergens,
      traits,
    };

    console.log(payload);

    optimizeMutation.mutate(payload);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dot-grid flex items-center justify-center">
        <div className="w-[2em] h-[2em] border-2 border-black border-t-transparent rounded-full animate-spin mr-1"></div>
      </div>
    );
  }
  if (isError) return <div>{String(error)}</div>;
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
                      minName="calories_min"
                      maxName="calories_max"
                      error={errors.calories}
                      showError={Boolean(touched.calories)}
                      onTouched={(k) => setTouched((prev) => ({ ...prev, [k]: true }))}
                      onValidate={validateOne}
                      isRequired={true}
                    />
                    <RangeNumberField
                      rangeKey="protein"
                      label="Protein (g)"
                      minName="protein_min"
                      maxName="protein_max"
                      error={errors.protein}
                      showError={Boolean(touched.protein)}
                      onTouched={(k) => setTouched((prev) => ({ ...prev, [k]: true }))}
                      onValidate={validateOne}
                    />
                    <RangeNumberField
                      rangeKey="carbs"
                      label="Carbohydrates (g)"
                      minName="carb_min"
                      maxName="carb_max"
                      error={errors.carbs}
                      showError={Boolean(touched.carbs)}
                      onTouched={(k) => setTouched((prev) => ({ ...prev, [k]: true }))}
                      onValidate={validateOne}
                    />
                    <RangeNumberField
                      rangeKey="fats"
                      label="Fats (g)"
                      minName="fat_min"
                      maxName="fat_max"
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
                              minName="sugar_min"
                              maxName="sugar_max"
                              error={errors.sugar}
                              showError={Boolean(touched.sugar)}
                              onTouched={(k) => setTouched((prev) => ({ ...prev, [k]: true }))}
                              onValidate={validateOne}
                            />
                            <RangeNumberField
                              rangeKey="sodium"
                              label="Sodium (mg)"
                              minName="sodium_min"
                              maxName="sodium_max"
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
                      <Accordion.Item value="allergies">
                        <Accordion.AccordionTrigger
                          className="
                            text-left text-fluid-lg w-fit
                            [&[data-state=open]_svg]:rotate-180
                          "
                        >
                          <div className="text-fluid-sm flex items-center gap-1">
                            <p>Allergies</p>
                            <ArrowDown
                              className="
                                h-[1em] w-[1em]
                                transition-transform duration-200 ease-out
                                "
                            />
                            </div>
                            </Accordion.AccordionTrigger>
                          <Accordion.Content forceMount className="accordion-content overflow-hidden data-[state=closed]:h-0 data-[state=open]:h-(--radix-accordion-content-height)">
                          <div className="flex flex-col gap-2 my-1">
                            {Array.from(allergens).map((allergen) => (
                              <label key={allergen} className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  name="allergens[]"
                                  value={allergen}
                                  className="h-4 w-4 accent-black"
                                />
                                <span className="text-fluid-base">{capitalizeFirstLetter(allergen)}</span>
                              </label>
                            ))}
                          </div>
                        </Accordion.Content>
                      </Accordion.Item>
                    </Accordion.Root>
                    <div className="flex justify-end">
                      <Form.Submit asChild>
                        <Button scheme="dark" className="px-4 mt-2" disabled={optimizeMutation.isPending}>
                          {optimizeMutation.isPending ?
                            <div className="flex items-center">
                              <div className="w-[0.75em] h-[0.75em] border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                              <span>Generating</span>
                            </div>
                            : <span>Generate</span> }
                        </Button>
                      </Form.Submit>
                    </div>
                  </Form.Root>
                </div>
              </div>
              <div>
                {/* {optimizeMutation.isError ? (
                  <pre>{String(optimizeMutation.error)}</pre>
                ) : null} */}
                {optimizeMutation.isError ? (
                  <div className="border-[1.5px] border-red-200 rounded-lg p-4 bg-red-100/50 mt-4">
                    <div className="text-center text-red-800">
                      <ShieldAlert className="mx-auto mb-2"/>
                      <p>Seems like there was an error.</p>
                      <p>Please try again at another time.</p>
                    </div>
                  </div>
                ) : null}
                {optimizeMutation.data ? (
                  [optimizeMutation.data].map((meals:any) => {
                    return(
                      <div className="flex flex-col gap-4 mt-4">
                        {meals.map((data:any, index:number) => {
                          // console.log(data.options)
                          // console.log(data)
                          return(
                            <div className="border-[1.5px] border-neutral-300 rounded-lg p-4 bg-conic-[from_270deg,white_0%,rgba(255,255,255,0.50)_50%,rgba(255,255,255,0)_75%,white_100%]">
                              <h1 className="text-fluid-xl font-bold mb-3">
                                #{String(index + 1).padStart(2, "0")}
                              </h1>

                              <div className="flex flex-col gap-6">
                                {data.options.map((mealItem: any) => (
                                  <div
                                    key={mealItem.id}
                                    className="
                                      grid
                                      grid-cols-[auto_1fr]         /* mobile */
                                      sm:grid-cols-[auto_1fr_auto] /* desktop */
                                      items-start
                                      gap-x-3
                                      gap-y-1
                                      
                                    "
                                  >
                                    {/* Quantity */}
                                    <p className="font-mono">
                                      [{mealItem.quantity}x]
                                    </p>

                                    {/* Name + components */}
                                    <div>
                                      <p className="text-fluid-base leading-snug wrap-break-word">
                                        {mealItem.name}
                                      </p>

                                      {mealItem.components.length > 1 ?
                                        <div className="flex gap-1 text-fluid-sm text-neutral-600 mt-1">
                                          <p>Includes:</p>
                                          <div className="flex flex-col">
                                            {mealItem.components.map((component: any) => (
                                              <p key={component}>{component}</p>
                                            ))}
                                          </div>
                                        </div> : null}
                                    </div>
                                    <div
                                      className="
                                        flex flex-wrap gap-1
                                        col-span-2        /* mobile: full width under name */
                                        mt-1
                                        sm:col-span-1    /* desktop: normal column */
                                        sm:justify-end
                                        sm:mt-0
                                      "
                                    >
                                      <Badge color="lime">{mealItem.station}</Badge>
                                      <Badge color="lime">
                                        {mealItem.components.length === 1 ? "Side Item" : "Full Plate"}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="border border-amber-200 bg-amber-50 text-fluid-base text-black p-4 rounded-lg mt-4">
                                <div className="flex gap-2 items-center">
                                  <div className="rounded-full bg-amber-600 h-[0.5em] w-[0.5em]"/>
                                  <h3 className="text-fluid-sm font-mono tracking-tight">Nutritional Summary</h3>
                                </div>
                                <div className="flex flex-col gap-1 mt-2">
                                  <div className="flex justify-between w-full">
                                    <p className="font-bold">Calories</p>
                                    <p className="font-mono">
                                      {data.total_calories_kcal}kcal
                                    </p>
                                  </div>
                                  <div className="flex justify-between w-full">
                                    <p className="font-bold">Protein</p>
                                    <p className="font-mono">
                                      {data.total_protein_g}g
                                    </p>
                                  </div>
                                  <div className="flex justify-between w-full">
                                    <p className="font-bold">Carbohydrates</p>
                                    <p className="font-mono">
                                      {data.total_carbohydrate_g}g
                                    </p>
                                  </div>
                                  <div className="flex justify-between w-full">
                                    <p className="font-bold">Fats</p>
                                    <p className="font-mono">
                                      {data.total_fat_g}g
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })
                ) : null}
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
