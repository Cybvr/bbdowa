"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export type GraphNode = {
  id: string;
  label: string;
  kind: "root" | "department" | "category" | "company" | "team" | "creator";
  href?: string;
};

export type GraphLink = { source: string; target: string };

type SimNode = GraphNode & {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  degree: number;
  fixed: boolean;
};

const COLORS: Record<GraphNode["kind"], string> = {
  root: "#111111",
  department: "#e51b23",
  category: "#e51b23",
  company: "#b3b3b3",
  team: "#111111",
  creator: "#555555",
};

export function UserGraph({ nodes, links }: { nodes: GraphNode[]; links: GraphLink[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const degree = new Map<string, number>();
    for (const link of links) {
      degree.set(link.source, (degree.get(link.source) ?? 0) + 1);
      degree.set(link.target, (degree.get(link.target) ?? 0) + 1);
    }

    const simNodes: SimNode[] = nodes.map((node, index) => {
      const angle = (index / nodes.length) * Math.PI * 2;
      const spread = 160 + (index % 7) * 60;
      const nodeDegree = degree.get(node.id) ?? 0;
      return {
        ...node,
        x: Math.cos(angle) * spread,
        y: Math.sin(angle) * spread,
        vx: 0,
        vy: 0,
        degree: nodeDegree,
        radius: node.kind === "root" ? 13 : Math.min(4 + nodeDegree * 1.1, 12),
        fixed: false,
      };
    });
    const byId = new Map(simNodes.map((node) => [node.id, node]));
    const simLinks = links
      .map((link) => ({ a: byId.get(link.source), b: byId.get(link.target) }))
      .filter((link): link is { a: SimNode; b: SimNode } => Boolean(link.a && link.b));
    const neighbors = new Map<string, Set<string>>();
    for (const { a, b } of simLinks) {
      if (!neighbors.has(a.id)) neighbors.set(a.id, new Set());
      if (!neighbors.has(b.id)) neighbors.set(b.id, new Set());
      neighbors.get(a.id)!.add(b.id);
      neighbors.get(b.id)!.add(a.id);
    }

    let scale = 0.9;
    let offsetX = 0;
    let offsetY = 0;
    let width = 0;
    let height = 0;
    let alpha = 1;
    let hovered: SimNode | null = null;
    let dragging: SimNode | null = null;
    let panning = false;
    let moved = 0;
    let lastX = 0;
    let lastY = 0;
    let raf = 0;

    const dpr = Math.max(window.devicePixelRatio || 1, 1);

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      offsetX = offsetX || width / 2;
      offsetY = offsetY || height / 2;
    }

    function toWorld(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect();
      return {
        x: (clientX - rect.left - offsetX) / scale,
        y: (clientY - rect.top - offsetY) / scale,
      };
    }

    function hitTest(clientX: number, clientY: number): SimNode | null {
      const point = toWorld(clientX, clientY);
      for (let i = simNodes.length - 1; i >= 0; i--) {
        const node = simNodes[i];
        const dx = node.x - point.x;
        const dy = node.y - point.y;
        const reach = node.radius + 4 / scale;
        if (dx * dx + dy * dy <= reach * reach) return node;
      }
      return null;
    }

    function step() {
      // Repulsion between every pair; n is small enough for the naive loop.
      for (let i = 0; i < simNodes.length; i++) {
        const a = simNodes[i];
        for (let j = i + 1; j < simNodes.length; j++) {
          const b = simNodes[j];
          let dx = a.x - b.x;
          let dy = a.y - b.y;
          let distSq = dx * dx + dy * dy;
          if (distSq < 1) {
            dx = (Math.random() - 0.5) * 2;
            dy = (Math.random() - 0.5) * 2;
            distSq = dx * dx + dy * dy;
          }
          const force = (1600 * alpha) / distSq;
          const dist = Math.sqrt(distSq);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }
      }
      for (const { a, b } of simLinks) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const rest = 70 + a.radius + b.radius;
        const force = (dist - rest) * 0.025 * alpha;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }
      for (const node of simNodes) {
        node.vx -= node.x * 0.004 * alpha;
        node.vy -= node.y * 0.004 * alpha;
        if (node.fixed) {
          node.vx = 0;
          node.vy = 0;
          continue;
        }
        node.vx *= 0.85;
        node.vy *= 0.85;
        node.x += node.vx;
        node.y += node.vy;
      }
      alpha = Math.max(alpha * 0.995, 0.03);
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.setTransform(scale * dpr, 0, 0, scale * dpr, offsetX * dpr, offsetY * dpr);

      const focus = hovered ?? dragging;
      const focusSet = focus ? neighbors.get(focus.id) : null;

      for (const { a, b } of simLinks) {
        const active = focus && (a.id === focus.id || b.id === focus.id);
        ctx.strokeStyle = active ? "#e51b23" : "#d4d4d4";
        ctx.globalAlpha = focus && !active ? 0.15 : active ? 0.9 : 0.6;
        ctx.lineWidth = (active ? 1.6 : 1) / scale;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      const labelAlpha = Math.min(1, Math.max(0, (scale - 0.65) * 2.2));
      for (const node of simNodes) {
        const isFocus = focus?.id === node.id;
        const isNeighbor = focusSet?.has(node.id) ?? false;
        const dimmed = focus && !isFocus && !isNeighbor;
        ctx.globalAlpha = dimmed ? 0.2 : 1;
        ctx.fillStyle = COLORS[node.kind];
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
        if (isFocus) {
          ctx.strokeStyle = "#e51b23";
          ctx.lineWidth = 2 / scale;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 3 / scale, 0, Math.PI * 2);
          ctx.stroke();
        }

        const hubLabel = node.kind === "root" || node.kind === "department" || node.kind === "category";
        let textAlpha = hubLabel ? Math.max(labelAlpha, 0.85) : labelAlpha;
        if (isFocus || isNeighbor) textAlpha = 1;
        if (dimmed) textAlpha = 0.1;
        if (textAlpha <= 0.02) continue;
        ctx.globalAlpha = textAlpha;
        ctx.fillStyle = "#111111";
        ctx.font = `${hubLabel ? 11 : 10}px Roboto Mono, monospace`;
        ctx.textAlign = "center";
        ctx.fillText(node.label, node.x, node.y + node.radius + 12);
      }
      ctx.globalAlpha = 1;
    }

    function frame() {
      step();
      draw();
      raf = requestAnimationFrame(frame);
    }

    function onPointerDown(event: PointerEvent) {
      canvas!.setPointerCapture(event.pointerId);
      moved = 0;
      lastX = event.clientX;
      lastY = event.clientY;
      const node = hitTest(event.clientX, event.clientY);
      if (node) {
        dragging = node;
        node.fixed = true;
        alpha = Math.max(alpha, 0.5);
      } else {
        panning = true;
      }
    }

    function onPointerMove(event: PointerEvent) {
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      if (dragging || panning) moved += Math.abs(dx) + Math.abs(dy);
      if (dragging) {
        const point = toWorld(event.clientX, event.clientY);
        dragging.x = point.x;
        dragging.y = point.y;
        alpha = Math.max(alpha, 0.4);
      } else if (panning) {
        offsetX += dx;
        offsetY += dy;
      } else {
        hovered = hitTest(event.clientX, event.clientY);
        canvas!.style.cursor = hovered ? "pointer" : "grab";
      }
      lastX = event.clientX;
      lastY = event.clientY;
    }

    function onPointerUp(event: PointerEvent) {
      if (dragging) {
        const node = dragging;
        node.fixed = false;
        dragging = null;
        if (moved < 5 && node.href) router.push(node.href);
      }
      panning = false;
      canvas!.releasePointerCapture(event.pointerId);
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      const rect = canvas!.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const zoom = Math.exp(-event.deltaY * 0.0015);
      const next = Math.min(Math.max(scale * zoom, 0.25), 4);
      offsetX = mouseX - ((mouseX - offsetX) / scale) * next;
      offsetY = mouseY - ((mouseY - offsetY) / scale) * next;
      scale = next;
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.style.cursor = "grab";
    canvas.style.touchAction = "none";
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [nodes, links, router]);

  return <canvas ref={canvasRef} className="block h-full w-full" />;
}
