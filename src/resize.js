export default function resize(camera, renderer) {
  window.addEventListener("resize", () => {
    // Met à jour la caméra
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Met à jour le moteur de rendu
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });
}