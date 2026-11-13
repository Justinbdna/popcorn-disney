export default function resize(camera, renderer, getPixelRatio) {
  let resizeRaf = 0;

  const applyResize = () => {
    resizeRaf = 0;
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    const ratio =
      typeof getPixelRatio === "function"
        ? getPixelRatio()
        : width < 768
          ? 1
          : Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(ratio);
    if (typeof window.demanderRendu === "function") window.demanderRendu();
  };

  window.addEventListener("resize", () => {
    if (!resizeRaf) resizeRaf = requestAnimationFrame(applyResize);
  });
}