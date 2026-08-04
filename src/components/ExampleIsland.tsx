/**
 * Example React island — unused yet so the home page stays identical.
 * Import into an Astro page with client:load / client:visible when ready.
 *
 *   import ExampleIsland from "../components/ExampleIsland";
 *   <ExampleIsland client:load />
 */
export default function ExampleIsland({ label = "React" }: { label?: string }) {
  return <span data-react-island={label} hidden />;
}
