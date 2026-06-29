export default function resize(camera, renderer) {
  window.addEventListener("resize", () => {
    // Met à jour la caméra
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Met à jour le moteur de rendu
    renderer.setSize(window.innerWidth, window.innerHeight);
    const isMobile = window.innerWidth < 768;
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
  });
}