"use client";

import { useCallback, useEffect, useState } from "react";
import { PITCH_STAGES } from "@/lib/pitch-stages";

const STORAGE_KEY = "bbdo-pitch-workflow-v1";

type Checked = Record<string, 1>;

function stageFromHash(): number {
  const match = /^#s(\d+)$/.exec(window.location.hash);
  const index = match ? Number(match[1]) - 1 : 0;
  return index >= 0 && index < PITCH_STAGES.length ? index : 0;
}

export function PitchChecklist() {
  const [checked, setChecked] = useState<Checked>({});
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setChecked(JSON.parse(stored) as Checked);
    } catch {
      /* ignore unreadable storage */
    }
    setCurrent(stageFromHash());

    const onHashChange = () => setCurrent(stageFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const persist = useCallback((next: Checked) => {
    setChecked(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore unwritable storage */
    }
  }, []);

  const show = useCallback((index: number, focusTab: boolean) => {
    setCurrent(index);
    window.history.replaceState(null, "", `#s${index + 1}`);
    if (focusTab) document.getElementById(`tab-${index}`)?.focus({ preventScroll: true });
  }, []);

  const doneIn = (stageIndex: number) =>
    PITCH_STAGES[stageIndex].tasks.reduce(
      (count, _task, taskIndex) => count + (checked[`${stageIndex}:${taskIndex}`] ? 1 : 0),
      0,
    );

  const total = PITCH_STAGES.reduce((sum, stage) => sum + stage.tasks.length, 0);
  const complete = PITCH_STAGES.reduce((sum, _stage, index) => sum + doneIn(index), 0);
  const pct = total ? Math.round((complete / total) * 100) : 0;

  const stage = PITCH_STAGES[current];

  return (
    <>
      <div className="flex items-center gap-[clamp(14px,2vw,28px)] border-b border-foreground px-[clamp(24px,6vw,96px)] py-4 max-[860px]:flex-wrap max-[860px]:gap-3">
        <h2 className="m-0 text-[clamp(20px,2.4vw,30px)] uppercase leading-none tracking-[-0.045em] max-[860px]:w-full">
          Pitch Progress
        </h2>
        <div className="flex-1" />
        <div className="h-2 w-[clamp(90px,20vw,280px)] bg-[#dcd8d0]">
          <div
            className="h-full bg-primary transition-[width] duration-[250ms] ease-out motion-reduce:transition-none"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[13px] font-extrabold tracking-[0.06em] [font-variant-numeric:tabular-nums]">
          {pct}%
        </span>
        <button
          type="button"
          onClick={() => persist({})}
          className="cursor-pointer border-2 border-foreground bg-transparent px-[13px] py-2 text-[11px] font-extrabold uppercase tracking-[0.1em] text-foreground hover:bg-foreground hover:text-white focus-visible:bg-foreground focus-visible:text-white"
        >
          Reset
        </button>
      </div>

      <div className="grid min-h-[calc(100vh-240px)] grid-cols-[minmax(250px,320px)_minmax(0,1fr)] max-[860px]:block max-[860px]:min-h-0">
        <div
          role="tablist"
          aria-label="Pitch stages"
          className="border-r border-border pb-10 pt-[18px] max-[860px]:sticky max-[860px]:top-[68px] max-[860px]:z-[5] max-[860px]:flex max-[860px]:items-center max-[860px]:gap-2 max-[860px]:overflow-x-auto max-[860px]:border-b max-[860px]:border-b-border max-[860px]:border-r-0 max-[860px]:bg-background max-[860px]:px-[clamp(16px,4vw,24px)] max-[860px]:py-3"
        >
          <div className="px-[clamp(20px,3vw,34px)] pb-3 pt-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground max-[860px]:hidden">
            Stages
          </div>
          {PITCH_STAGES.map((item, index) => {
            const done = doneIn(index);
            const selected = index === current;
            const allDone = done === item.tasks.length;
            return (
              <button
                key={item.title}
                type="button"
                role="tab"
                id={`tab-${index}`}
                aria-controls="panel-view"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => show(index, true)}
                onKeyDown={(event) => {
                  let next: number | null = null;
                  if (event.key === "ArrowDown" || event.key === "ArrowRight")
                    next = (index + 1) % PITCH_STAGES.length;
                  if (event.key === "ArrowUp" || event.key === "ArrowLeft")
                    next = (index - 1 + PITCH_STAGES.length) % PITCH_STAGES.length;
                  if (event.key === "Home") next = 0;
                  if (event.key === "End") next = PITCH_STAGES.length - 1;
                  if (next !== null) {
                    event.preventDefault();
                    show(next, true);
                  }
                }}
                className={`grid w-full cursor-pointer grid-cols-[26px_1fr_auto] items-center gap-2.5 border-0 border-l-4 px-[clamp(20px,3vw,34px)] py-3 text-left text-[16px] font-semibold leading-[1.15] focus-visible:outline-none max-[860px]:w-auto max-[860px]:flex-none max-[860px]:grid-cols-[auto_auto_auto] max-[860px]:gap-2 max-[860px]:whitespace-nowrap max-[860px]:border max-[860px]:border-border max-[860px]:border-l-4 max-[860px]:px-[13px] max-[860px]:py-[9px] max-[860px]:text-[13px] ${
                  selected
                    ? "border-l-primary bg-foreground text-white"
                    : "border-l-transparent bg-transparent text-foreground hover:bg-foreground/5 max-[860px]:border-l-border"
                }`}
              >
                <span
                  className={`text-[12px] font-extrabold [font-variant-numeric:tabular-nums] ${
                    selected ? "text-white/70" : "text-muted-foreground"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{item.title}</span>
                <span
                  className={`text-[12px] font-extrabold [font-variant-numeric:tabular-nums] ${
                    selected ? "text-white" : allDone ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {done}/{item.tasks.length}
                </span>
              </button>
            );
          })}
        </div>

        <div className="px-[clamp(24px,4vw,64px)] pb-14 pt-[clamp(26px,3.6vw,52px)]">
          <div id="panel-view" role="tabpanel" aria-labelledby={`tab-${current}`}>
            <p className="mb-2.5 mt-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary">
              Stage {current + 1} of {PITCH_STAGES.length}
            </p>
            <h2 className="mb-[26px] mt-0 max-w-[16ch] text-[clamp(34px,5vw,66px)] uppercase leading-[0.92] tracking-[-0.055em]">
              {stage.title}
            </h2>
            <ul className="m-0 max-w-[900px] list-none border-t border-border p-0">
              {stage.tasks.map((task, taskIndex) => {
                const key = `${current}:${taskIndex}`;
                const isChecked = Boolean(checked[key]);
                return (
                  <li key={task} className="border-b border-border">
                    <label className="grid cursor-pointer grid-cols-[22px_1fr] items-start gap-3.5 px-1 py-[15px] text-[clamp(17px,1.5vw,21px)] leading-[1.32] hover:bg-foreground/[0.04]">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(event) => {
                          const next = { ...checked };
                          if (event.target.checked) next[key] = 1;
                          else delete next[key];
                          persist(next);
                        }}
                        className="peer absolute h-0 w-0 opacity-0"
                      />
                      <span className="mt-[3px] grid h-[22px] w-[22px] place-items-center border-2 border-primary transition-colors duration-150 after:h-1.5 after:w-[11px] after:-rotate-45 after:scale-0 after:border-b-[3px] after:border-l-[3px] after:border-white after:transition-transform after:duration-150 after:content-[''] peer-checked:bg-primary peer-checked:after:scale-100 peer-focus-visible:outline-none motion-reduce:transition-none motion-reduce:after:transition-none" />
                      <span className="peer-checked:text-muted-foreground peer-checked:line-through peer-checked:decoration-primary">
                        {task}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 flex gap-2.5">
              <button
                type="button"
                disabled={current === 0}
                onClick={() => show(current - 1, false)}
                className="cursor-pointer border-2 border-foreground bg-transparent px-[18px] py-3 text-[12px] font-extrabold uppercase tracking-[0.1em] text-foreground enabled:hover:bg-foreground enabled:hover:text-white disabled:cursor-default disabled:opacity-30"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={current === PITCH_STAGES.length - 1}
                onClick={() => show(current + 1, false)}
                className="cursor-pointer border-2 border-foreground bg-transparent px-[18px] py-3 text-[12px] font-extrabold uppercase tracking-[0.1em] text-foreground enabled:hover:bg-foreground enabled:hover:text-white disabled:cursor-default disabled:opacity-30"
              >
                Next stage
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
