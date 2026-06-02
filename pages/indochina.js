"use client";

import { Component, createRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import styles from "../styles/Indochina.module.css"

export default class Indochina extends Component {
	constructor(props){
		super(props)
		this.simRef = createRef()

		this.state = {
			orbitPeriod: 96
		}

		this.startEnvironment = this.startEnvironment.bind(this)

	}

	latLonToVector3(lat, lon, radius){

		const phi = (90 - lat) * (Math.PI / 180);
		const theta = (lon + 180) * (Math.PI / 180);

		const x = - ( radius * Math.sin(phi) * Math.cos(theta));
		const y = radius * Math.cos(phi);
		const z = radius * Math.sin(phi) * Math.sin(theta);
		

		return new THREE.Vector3(x,y,z);
	}


	// =====================================================
	// DMS TO DECIMAL
	// =====================================================

	dmsToDecimal(deg, min, sec, dir){

		let dec =
			deg +
			(min / 60) +
			(sec / 3600);

		if (
			dir === "S" ||
			dir === "W"
		){

			dec *= -1;
		}

		return dec;
	}

	// =====================================================
	// CREATE MISSILE STRIKE CIRCLE
	// =====================================================

	createMissileStrikeRing({
		lat,
		lon,
		rangeKm = 1450,
		color = "yellow"
	}){
		const radius = (rangeKm / 6371);
		const ring = new THREE.Mesh(
			new THREE.RingGeometry(radius, radius + 0.003, 128),
			new THREE.MeshBasicMaterial({
				color,
				side:THREE.DoubleSide,
				transparent: true,
				opacity: 0.25
			})
		);

		this.scene.add(ring);
		this.missileStrikeRings.push({ lat, lon, mesh: ring});
	}

	async startEnvironment(){
		console.log("Starting Environment")

		this.setState({
			startTime: new Date()
		})

		const mount = this.simRef.current

		// Setup Scene
		this.scene = new THREE.Scene()

		// Setup Camera
		this.camera = new THREE.PerspectiveCamera(
			60, mount.clientWidth/mount.clientHeight, 0.1, 1000
		)

		this.camera.position.set(0, 1.5, 3)

		// Setup RENDERER
		this.renderer = new THREE.WebGLRenderer({
			antialias: true
		})

		this.renderer.setSize( mount.clientWidth, mount.clientHeight);
		this.renderer.setPixelRatio(window.devicePixelRatio);

		mount.appendChild(this.renderer.domElement);

		// Adding CONTROL
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.controls.enableDamping = true

		// Adding SUN
		this.sun = new THREE.DirectionalLight(
			0xffffff,
			8
		);

		this.scene.add(this.sun);

		const ambient = new THREE.AmbientLight( 0xffffff, 0.3);
		this.scene.add(ambient);

		// Adding EARTH
		const loader = new THREE.TextureLoader();
		const earthTexture = loader.load("/textures/8081_earthlights4k.jpg")

		this.earth = new THREE.Mesh(
			new THREE.SphereGeometry(1, 64, 64),
			new THREE.MeshStandardMaterial({ map: earthTexture})
		)

		this.scene.add(this.earth)

		// ORBIT PARAM
		this.earthRadius = 1;
		this.orbitPeriod = this.state.orbitPeriod
		this.earthAngularVelocity = (2 * Math.PI) / (24 * 3600)

		// PIG still try to LIGHT propaganda ???
		// FUCK OFF PIG

		// MISSILE CITIES
		this.missileCities = []
		this.missileStrikeRings = [];

		let missileSites = [
			{lat: 11.670133253474399 , lon: 108.48093101445289}, 
			{lat: 21.105600053707754, lon: 106.5671037381583}
		]

		// CREATE MISSILE SITE MARKER
		missileSites.forEach((site) => {
			console.log("Missile Site ", site)
			const triangleShape = new THREE.Shape();
			
			triangleShape.moveTo(
				0,
				0.010/3
			);

			triangleShape.lineTo(
				-0.008/3,
				-0.008/3
			);

			triangleShape.lineTo(
				0.008/3,
				-0.008/3
			);

			triangleShape.lineTo(
				0,
				0.010/3
			);

			const geometry = new THREE.ShapeGeometry(triangleShape);
			const material = new THREE.MeshBasicMaterial({
				color: "yellow",
				side: THREE.DoubleSide
			});

			const marker = new THREE.Mesh(geometry,material);
			this.scene.add(marker);

			this.missileCities.push({
				mesh: marker,
				lat: site.lat,
				lon: site.lon
			});
		})

		// CREATE MISSILE STRIKE PARAM
		missileSites.forEach((site) => {
			this.createMissileStrikeRing({
				lat: site.lat,
				lon: site.lon,
				rangeKm: 1000,
				color: "yellow"
			});
		});

		const animate = () => {

			this.animationId = requestAnimationFrame(animate)
			
			let currentTime = new Date()
			const t = (currentTime - this.state.startTime)

			// Earth Rotation
			this.earth.rotation.y = this.earthAngularVelocity * t
			// console.log("Time T", t, this.earth.rotation.y)
			// this.earth.rotation.y = 10

			// Sun fixed along +X
			this.sun.position.set(10,0,0);

			// this.controls.update()

			this.renderer.render(
				this.scene,
				this.camera
			)

			// Animate Missile City Marker 
			this.missileCities.forEach((site) => {

				const pos = this.latLonToVector3(site.lat, site.lon, this.earthRadius + 0.004);
				pos.applyAxisAngle(
					new THREE.Vector3(0,1,0),
					this.earth.rotation.y
				);

				// console.log("Putting marker at position ", pos)

				site.mesh.position.copy(pos);
				site.mesh.lookAt(0,0,0);

				// slow pulse

				const pulse = 1 + (Math.sin(t * 0.003) * 0.15);
				site.mesh.scale.set(
					pulse,
					pulse,
					pulse
				);
			});

			// =================================
			// MISSILE STRIKE RINGS
			// =================================

			this.missileStrikeRings.forEach((ringObj) => {

				const ringPos =
					this.latLonToVector3(

						ringObj.lat,
						ringObj.lon,

						this.earthRadius + 0.002
					);

				ringPos.applyAxisAngle(

					new THREE.Vector3(0,1,0),

					this.earth.rotation.y
				);

				ringObj.mesh.position.copy(
					ringPos
				);

				ringObj.mesh.lookAt(
					0,
					0,
					0
				);

				// pulse effect

				const pulse =
					1 +
					(Math.sin(t * 0.002) * 0.03);

				ringObj.mesh.scale.set(

					pulse,
					pulse,
					pulse
				);
			});
		}

		animate()
	}

	componentDidMount(){
		this.startEnvironment()
	}

	// componentWillUnmount(){
	// 	cancelAnimationFrame(
	// 		this.animationId
	// 	);

	// 	window.removeEventListener(

	// 		"resize",

	// 		this.handleResize
	// 	);

	// 	if (this.renderer){

	// 		this.renderer.dispose();
	// 	}
	// }


	render(){
		return (
			<div className={styles.container}>
				<div className={styles.infoPanel}>
					Indochina
				</div>
				<div
					ref={this.simRef}
					className={styles.satSim}
				/>
			</div>
		)
	}
}