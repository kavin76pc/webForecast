const threeState = {
  scene: null,
  camera: null,
  renderer: null,
  particles: null,
  particleMaterial: null,
  arcs: [],
  rotationSpeed: 0.002,
  targetIntensity: 0.5,
};

function predict() {
  const place = document.getElementById("place").value.trim();
  if (!place) {
    updateResult({
      summary: "Please enter a place to generate a forecast.",
      highlights: [],
    });
    return;
  }

  fetch("http://localhost:8080/api/forecast", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      place: place,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      updateResult(data);
      updateChartImage(data.chartImageUrl);
      renderChart(data.series || []);
      updateThreeWithSeries(data.series || []);
    });
}

function updateResult(data) {
  const summary = document.querySelector(".result__summary");
  const highlights = document.querySelector(".result__highlights");
  const headline = document.querySelector(".result__headline");
  const timestamp = document.getElementById("timestamp");

  headline.textContent = data.place
    ? `Forecast Summary — ${data.place}`
    : "Forecast Summary";
  summary.textContent = data.summary || "No summary available.";
  highlights.innerHTML = "";
  (data.highlights || []).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    highlights.appendChild(li);
  });
  timestamp.textContent = data.generatedAt
    ? `Generated ${data.generatedAt}`
    : "";
}

function renderChart(series) {
  const canvas = document.getElementById("forecastChart");
  const ctx = canvas.getContext("2d");
  const image = document.getElementById("forecastImage");
  const width = canvas.width;
  const height = canvas.height;
  const padding = 40;

  if (!image.hasAttribute("hidden")) {
    canvas.classList.add("is-hidden");
    return;
  }

  canvas.classList.remove("is-hidden");
  ctx.clearRect(0, 0, width, height);

  if (!series.length) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px sans-serif";
    ctx.fillText("Forecast chart will appear here.", padding, height / 2);
    return;
  }

  const demands = series.map((point) => point.demand);
  const minDemand = Math.min(...demands);
  const maxDemand = Math.max(...demands);

  const scaleX = (index) =>
    padding + (index / (series.length - 1)) * (width - padding * 2);
  const scaleY = (value) =>
    height -
    padding -
    ((value - minDemand) / (maxDemand - minDemand || 1)) *
      (height - padding * 2);

  ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 3;
  ctx.beginPath();
  series.forEach((point, index) => {
    const x = scaleX(index);
    const y = scaleY(point.demand);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "12px sans-serif";
  series.forEach((point, index) => {
    if (index % 6 === 0 || index === series.length - 1) {
      const x = scaleX(index);
      const y = height - padding + 18;
      ctx.fillText(point.hour, x - 6, y);
    }
  });
}

function updateChartImage(imageUrl) {
  const image = document.getElementById("forecastImage");
  if (imageUrl) {
    image.src = imageUrl;
    image.removeAttribute("hidden");
    return;
  }
  image.setAttribute("hidden", "");
  image.removeAttribute("src");
}

function initThreeScene() {
  if (typeof THREE === "undefined") {
    return;
  }

  const container = document.getElementById("three-container");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 120;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  container.appendChild(renderer.domElement);

  const particleGeometry = new THREE.BufferGeometry();
  const particleCount = 160;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 180;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 140;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
  }
  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  const particleMaterial = new THREE.PointsMaterial({
    color: 0x38bdf8,
    size: 1.8,
    transparent: true,
    opacity: 0.6,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  const arcs = [];
  for (let i = 0; i < 3; i += 1) {
    const curve = new THREE.EllipseCurve(
      0,
      0,
      36 + i * 10,
      18 + i * 8,
      0,
      2 * Math.PI
    );
    const points = curve.getPoints(80);
    const arcGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const arcMaterial = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.2 + i * 0.1,
    });
    const arc = new THREE.LineLoop(arcGeometry, arcMaterial);
    arc.rotation.x = Math.PI / 2.5;
    arc.rotation.y = i * 0.7;
    arcs.push(arc);
    scene.add(arc);
  }

  threeState.scene = scene;
  threeState.camera = camera;
  threeState.renderer = renderer;
  threeState.particles = particles;
  threeState.particleMaterial = particleMaterial;
  threeState.arcs = arcs;

  const animate = () => {
    if (!threeState.scene) {
      return;
    }
    threeState.particles.rotation.y += threeState.rotationSpeed;
    threeState.particles.rotation.x += threeState.rotationSpeed * 0.6;
    threeState.arcs.forEach((arc, index) => {
      arc.rotation.z += threeState.rotationSpeed * (index + 1) * 0.4;
      arc.material.opacity =
        0.15 + threeState.targetIntensity * (0.2 + index * 0.1);
    });
    threeState.particleMaterial.opacity = 0.4 + threeState.targetIntensity * 0.4;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();
}

function updateThreeWithSeries(series) {
  if (!threeState.particles || !series.length) {
    return;
  }
  const demands = series.map((point) => point.demand);
  const avgDemand =
    demands.reduce((sum, value) => sum + value, 0) / demands.length;
  const normalized = Math.min(Math.max((avgDemand - 700) / 500, 0), 1);
  threeState.rotationSpeed = 0.0015 + normalized * 0.004;
  threeState.targetIntensity = 0.3 + normalized * 0.7;

  const positions = threeState.particles.geometry.attributes.position.array;
  series.forEach((point, index) => {
    const angle = (index / series.length) * Math.PI * 2;
    const radius = 40 + (point.demand - avgDemand) * 0.06;
    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = Math.sin(angle) * radius;
    positions[index * 3 + 2] = (Math.random() - 0.5) * 80;
  });
  threeState.particles.geometry.attributes.position.needsUpdate = true;
}

initThreeScene();
