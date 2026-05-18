"use client";

import { Component, createRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import styles from '../styles/Main.module.css';

export default class Main extends Component {

	constructor(props){
		super(props);
		this.mountRef = createRef();
	}

	// =========================
	// ADD PLANE SYSTEM
	// =========================
	addPlane({ sats = 3, raan = 0 }) {
		for (let i = 0; i < sats; i++) {

			const phase = (2 * Math.PI / sats) * i;

			const sat = new THREE.Mesh(
				new THREE.SphereGeometry(0.01, 12, 12),
				new THREE.MeshBasicMaterial({ color: 0xffff00 })
			);

			this.scene.add(sat);

			this.satellites.push({
				mesh: sat,
				phase,
				raan
			});
		}

		this.addOrbitLine(raan);
	}

	// =========================
	// ORBIT LINE PER PLANE
	// =========================
	addOrbitLine(raan) {
		const segments = 128;
		const points = [];

		const radius = this.orbitRadius * 1.01;

		for (let s = 0; s <= segments; s++) {
			const angle = (2 * Math.PI * s) / segments;

			let x = radius * Math.cos(angle);
			let z = radius * Math.sin(angle);
			let y = 0;

			// inclination
			const cosI = Math.cos(this.inclination);
			const sinI = Math.sin(this.inclination);

			let yInclined = y * cosI - z * sinI;
			let zInclined = y * sinI + z * cosI;

			// RAAN rotation
			const cosR = Math.cos(raan);
			const sinR = Math.sin(raan);

			let xFinal = x * cosR - zInclined * sinR;
			let zFinal = x * sinR + zInclined * cosR;

			points.push(new THREE.Vector3(xFinal, yInclined, zFinal));
		}

		const geometry = new THREE.BufferGeometry().setFromPoints(points);

		const material = new THREE.LineBasicMaterial({
			color: 0xff4444,
			transparent: true,
			opacity: 0.6
		});

		const line = new THREE.LineLoop(geometry, material);
		this.scene.add(line);
		this.orbitLines.push(line);
	}

	async startEnvironment() {
		const mount = this.mountRef.current;

		// === SCENE ===
		this.scene = new THREE.Scene();

		this.camera = new THREE.PerspectiveCamera(
			60,
			mount.clientWidth / mount.clientHeight,
			0.1,
			1000
		);
		this.camera.position.set(0, 1.5, 3);

		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setSize(mount.clientWidth, mount.clientHeight);
		mount.appendChild(this.renderer.domElement);

		// === LIGHTING ===
		const sun = new THREE.DirectionalLight(0xffffff, 1.5);
		sun.position.set(5, 3, 5);
		this.scene.add(sun);

		const ambient = new THREE.AmbientLight(0xffffff, 0.3);
		this.scene.add(ambient);

		// === CONTROLS ===
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.enableDamping = true;

		// === EARTH TEXTURE ===
		const loader = new THREE.TextureLoader();

		const earthTexture = loader.load(
			"/textures/8k_earth_daymap.jpg",
			() => console.log("✅ texture loaded"),
			undefined,
			(err) => console.error("❌ texture failed", err)
		);

		this.earth = new THREE.Mesh(
			new THREE.SphereGeometry(1, 64, 64),
			new THREE.MeshStandardMaterial({
				map: earthTexture
			})
		);

		this.scene.add(this.earth);

		// === ORBIT PARAMS ===
		this.earthRadius = 1;
		this.altitude = 0.1;
		this.orbitRadius = this.earthRadius + this.altitude;

		this.orbitPeriod = 120;

		this.angularVelocity = (2 * Math.PI) / this.orbitPeriod;

		this.inclination = 51.6 * Math.PI / 180;

		this.startTime = Date.now();

		this.satellites = [];
		this.orbitLines = [];

		// =========================
		// INDIAN OCEAN OPTIMIZED CONSTELLATION
		// =========================

		const numberOfPlanes = 7;
		const satsPerPlane = 3;

		// Center ~80°E (Indian Ocean)
		const centerRAAN = 60 * Math.PI / 180;

		// Spread planes only across 120° sector
		const spread = 120 * Math.PI / 180;

		for (let p = 0; p < numberOfPlanes; p++) {

			const offset = (p / (numberOfPlanes - 1)) - 0.5;
			const raan = centerRAAN + offset * spread;

			this.addPlane({
				sats: satsPerPlane,
				raan
			});
		}

		// === ANIMATION LOOP ===
		const animate = () => {
			this.animationId = requestAnimationFrame(animate);

			const t = (Date.now() - this.startTime) / 1000;
			const baseAngle = this.angularVelocity * t;

			this.satellites.forEach((sat) => {

				const angle = baseAngle + sat.phase;

				let x = this.orbitRadius * Math.cos(angle);
				let z = this.orbitRadius * Math.sin(angle);
				let y = 0;

				// inclination
				const cosI = Math.cos(this.inclination);
				const sinI = Math.sin(this.inclination);

				let yInclined = y * cosI - z * sinI;
				let zInclined = y * sinI + z * cosI;

				// RAAN rotation
				const cosR = Math.cos(sat.raan);
				const sinR = Math.sin(sat.raan);

				let xFinal = x * cosR - zInclined * sinR;
				let zFinal = x * sinR + zInclined * cosR;

				sat.mesh.position.set(xFinal, yInclined, zFinal);
			});

			// Earth rotation
			this.earth.rotation.y += 0.0005;

			this.controls.update();
			this.renderer.render(this.scene, this.camera);
		};

		animate();

		// === RESIZE ===
		this.handleResize = () => {
			this.camera.aspect = mount.clientWidth / mount.clientHeight;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(mount.clientWidth, mount.clientHeight);
		};

		window.addEventListener("resize", this.handleResize);
	}

	componentDidMount(){
		this.startEnvironment();
	}

	componentWillUnmount() {
		cancelAnimationFrame(this.animationId);
		window.removeEventListener("resize", this.handleResize);
		if (this.renderer) this.renderer.dispose();
	}

	render(){
		return (
			<div className={styles.container}>
				<div ref={this.mountRef} className={styles.satSim} />
				<div className={styles.overlayInfo}>
					<div className={styles.title}>Sat Sim</div>
				</div>
			</div>
		);
	}
}