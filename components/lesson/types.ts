/**
 * Props of a tool that runs on its own page and inside Soạn bài (lesson
 * builder). `initialWords`: the lesson's words, used instead of the sample and
 * the URL hash. `embedded`: hide the Navbar, Footer and the page title.
 */
export type EmbeddableToolProps = {
  initialWords?: readonly string[];
  embedded?: boolean;
};
