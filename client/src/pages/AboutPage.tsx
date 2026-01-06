import { BananaIcon } from "lucide-react";
import { ArrowUpRight, ArrowLeft } from "lucide-react";
import Button from "../components/Button";
import { Link } from "react-router-dom"

function AboutPage() {
  return (
    <div className="min-h-screen bg-dot-grid">
      <div className="mx-auto min-w-60 max-w-4xl px-6 sm:px-12 md:px-24 py-10">
        <div className="flex flex-col gap-8">
          <div>
            <Link to="/">
              <Button scheme="dark"><ArrowLeft className="h-[1em] w-[1em]"/>Back</Button>
            </Link>
          </div>
          <div className="flex gap-1 items-center flex-wrap leading-none text-fluid-3xl tracking-tight">
            <BananaIcon className="w-[1em] h-[1em] text-yellow-500" />
            <h1 className="font-bold">FuelStack</h1>
          </div>
          <div className="flex flex-col gap-4">
            <div className="border-[1.5px] border-neutral-300 rounded-lg p-4 bg-conic-[from_270deg,white_0%,rgba(255,255,255,0.50)_50%,rgba(255,255,255,0)_75%,white_100%]">
              <h2 className="text-fluid-xl font-bold tracking-tight">About</h2>
              <p className="text-fluid-base">
                FuelStack was born out of firsthand frustration with manually
                tracking calories and protein in university dining halls. What
                began as a personal pain point evolved into a platform designed to
                simplify and optimize dining-hall nutrition. By setting a few
                dietary parameters, FuelStack generates optimized meal
                recommendations tailored to your specific goals, removing the
                guesswork from eating well on campus.
              </p>
              <br />
              <p className="text-fluid-base">
                Fuel Stack currently only supports dining hall menus at the
                University of Michigan.
              </p>
              <br />
              <p className="inline-flex items-center text-fluid-base">
                Created by&nbsp;
                <a
                  className="inline-flex items-center underline decoration-dotted underline-offset-4"
                  href={"https://www.linkedin.com/in/vannesschia"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Vanness Chia
                  <ArrowUpRight className="h-[1em] w-[1em] inline align-baseline" />
                </a>
                (2026).
              </p>
            </div>
            <div className="border-[1.5px] border-neutral-300 rounded-lg p-4 bg-conic-[from_270deg,white_0%,rgba(255,255,255,0.50)_50%,rgba(255,255,255,0)_75%,white_100%]">
              <h2 className="text-fluid-xl font-bold tracking-tight">
                Data Privacy
              </h2>
              <p className="text-fluid-base">
                FuelStack does not collect, store, or retain any personal user
                data. All inputs are processed in-session and are not saved after
                use.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
