"use client";

import { Component, createRef } from "react";

import * as THREE from "three";

import { OrbitControls }
	from "three/examples/jsm/controls/OrbitControls.js";

import styles from "../styles/Earth.module.css";

export default class Earth extends Component {

	constructor(props){

		super(props);

		this.simRef = createRef();

		this.state = {

			// =====================================
			// TIME
			// =====================================

			timeT: "",

			simProgress: 0,

			isDraggingTimeline: false,

			// =====================================
			// ORBIT
			// =====================================

			altitude: 0.089,

			orbitPeriod: 96,

			inclination: 97.7,

			// =====================================
			// SATELLITES
			// =====================================

			satSize: 0.006,

			satColor: "blue",

			numberOfPlanes: 3,

			satsPerPlane: 7,

			// =====================================
			// SATELLITE INFO PANEL
			// =====================================

			selectedSatellite: {

				name: "ICEYE SAR",

				image:
					"/satellites/iceye.jpg",

				operator:
					"ICEYE Finland",

				orbit:
					"LEO Sun-Synchronous",

				altitude:
					"570 km",

				resolution:
					"25 cm - 1 m SAR",

				revisit:
					"3-4 hours",

				role:
					"Synthetic Aperture Radar"
			},

			// MISSILE SELECTION 

			missiles: [
				{
					name: "Qiam-1",
					image: "/missiles/qiam1.jpg",
					speed: "1.9 km/s",
					range: "800 km",
					homing: "GPS / INS",
					type: "SRBM",
					warhead: "750 kg",
					role: "Ballistic Strike"
				},
				{
					name: "Kheibar Shekan",
					image: "/missiles/kheibar.jpg",
					speed: "3.5 km/s",
					range: "1450 km",
					homing: "GPS / INS",
					type: "MRBM",
					warhead: "High Explosive",
					role: "Precision Strike"
				},
				{
					name: "Fattah2",
					image: "/missiles/fattah2.jpg",
					speed: "4.5 km/s",
					range: "1500 km",
					homing: "Guided",
					type: "HGV",
					warhead: "Maneuverable",
					role: "Hypersonic Penetration"
				},
				{
					name: "DF17",
					image: "/missiles/df17.jpg",
					speed: "2.7 km/s",
					range: "2100 km",
					homing: "Radar",
					type: "MRBM + HGV",
					warhead: "Conventional",
					role: "Hypersonic Glide"
				},
				{
					name: "DF21",
					image: "/missiles/df21.jpg",
					speed: "2.1 km/s",
					range: "1650 km",
					homing: "Radar",
					type: "ASBM",
					warhead: "Anti-Ship",
					role: "Carrier Killer"
				}
			],

			selectedMissile: {
				name: "Kheibar Shekan",
				image: "/missiles/kheibar.jpg",
				speed: "3.5 km/s",
				range: "1450 km",
				homing: "GPS / INS",
				type: "MRBM",
				warhead: "High Explosive",
				role: "Precision Strike"
			},

			// CARRIER SELECTION
			activeCarrriers: [
				{
					name: "USS Abraham L",
					image:"/satellites/iceye.jpg"
				},
				{
					name: "USS George Washington",
					image:"/satellites/iceye.jpg"
				},
					{
					name: "USS George W Bush",
					image:"/satellites/iceye.jpg"
				}
			],

			selectedCarrierIndex: 0, 

			detectionMessages: []
		};

		this.startEnvironment =
			this.startEnvironment.bind(this);

		this.addPlane =
			this.addPlane.bind(this);

		this.selectSat =
			this.selectSat.bind(this);

		this.updateTimeline =
			this.updateTimeline.bind(this);

		this.startTimelineDrag =
			this.startTimelineDrag.bind(this);

		this.endTimelineDrag =
			this.endTimelineDrag.bind(this);

		this.selectCarrier = this.selectCarrier.bind(this);

		this.selectMissile = this.selectMissile.bind(this);

		this.updateTargetingData = this.updateTargetingData.bind(this);
	}

	// =====================================================
	// LAT/LON TO VECTOR
	// =====================================================

	latLonToVector3(lat, lon, radius){

		const phi =
			(90 - lat) *
			(Math.PI / 180);

		const theta =
			(lon + 180) *
			(Math.PI / 180);

		const x =
			-(
				radius *
				Math.sin(phi) *
				Math.cos(theta)
			);

		const z =
			radius *
			Math.sin(phi) *
			Math.sin(theta);

		const y =
			radius *
			Math.cos(phi);

		return new THREE.Vector3(
			x,
			y,
			z
		);
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
	// ADD SATELLITE PLANE
	// =====================================================

	addPlane({ sats = 1, raan = 0 }){

		for (let i = 0; i < sats; i++){

			const phase =
				(2 * Math.PI / sats) * i;

			// =================================
			// SATELLITE
			// =================================

			const sat =
				new THREE.Mesh(

					new THREE.SphereGeometry(

						this.state.satSize,

						12,

						12
					),

					new THREE.MeshBasicMaterial({

						color:
							this.state.satColor
					})
				);

			this.scene.add(sat);

			// =================================
			// FOOTPRINT
			// =================================

			const footprint =
				new THREE.Mesh(

					new THREE.CircleGeometry(
						0.035,
						64
					),

					new THREE.MeshBasicMaterial({

						color:
							this.state.satColor,

						transparent: true,

						opacity: 0.25,

						side:
							THREE.DoubleSide
					})
				);

			this.scene.add(footprint);

			this.satellites.push({

				mesh: sat,

				footprint,

				phase,

				raan
			});
		}

		this.addOrbitLine(raan);
	}

	// =====================================================
	// ORBIT LINE
	// =====================================================

	addOrbitLine(raan){

		const points = [];

		const segments = 256;

		const radius =
			this.orbitRadius;

		for (let s = 0; s <= segments; s++){

			const angle =
				(2 * Math.PI * s) /
				segments;

			let x =
				radius *
				Math.cos(angle);

			let y = 0;

			let z =
				radius *
				Math.sin(angle);

			// inclination

			const cosI =
				Math.cos(
					this.inclination
				);

			const sinI =
				Math.sin(
					this.inclination
				);

			let yInclined =
				y * cosI -
				z * sinI;

			let zInclined =
				y * sinI +
				z * cosI;

			// RAAN

			const cosR =
				Math.cos(raan);

			const sinR =
				Math.sin(raan);

			let xFinal =
				x * cosR -
				zInclined * sinR;

			let zFinal =
				x * sinR +
				zInclined * cosR;

			points.push(

				new THREE.Vector3(

					xFinal,

					yInclined,

					zFinal
				)
			);
		}

		const geometry =
			new THREE.BufferGeometry()
			.setFromPoints(points);

		const material =
			new THREE.LineBasicMaterial({

				color: "white",

				transparent: true,

				opacity: 0.1
			});

		const line =
			new THREE.LineLoop(
				geometry,
				material
			);

		this.scene.add(line);

		this.orbitLines.push(line);
	}

	// =====================================================
	// START ENVIRONMENT
	// =====================================================

	async startEnvironment(){

		const mount =
			this.simRef.current;

		// =====================================
		// SIMULATION WINDOW
		// =====================================

		this.warStart =
			new Date(
				"2026-03-01T00:00:00Z"
			);

		this.warEnd =
			new Date(
				"2026-03-02T00:00:00Z"
			);

		this.totalWarDuration =
			this.warEnd.getTime() -
			this.warStart.getTime();

		// =====================================
		// TIME SCALE
		// =====================================

		this.simMinutesPerSecond = 10;

		// =====================================
		// SCENE
		// =====================================

		this.scene =
			new THREE.Scene();

		// =====================================
		// CAMERA
		// =====================================

		this.camera =
			new THREE.PerspectiveCamera(

				60,

				mount.clientWidth /
				mount.clientHeight,

				0.1,

				1000
			);

		this.camera.position.set(
			0,
			1.5,
			3
		);

		// =====================================
		// RENDERER
		// =====================================

		this.renderer =
			new THREE.WebGLRenderer({

				antialias: true
			});

		this.renderer.setSize(

			mount.clientWidth,

			mount.clientHeight
		);

		this.renderer.setPixelRatio(
			window.devicePixelRatio
		);

		mount.appendChild(
			this.renderer.domElement
		);

		// =====================================
		// CONTROLS
		// =====================================

		this.controls =
			new OrbitControls(

				this.camera,

				this.renderer.domElement
			);

		this.controls.enableDamping =
			true;

		// =====================================
		// LIGHTING
		// =====================================

		const sun =
			new THREE.DirectionalLight(
				0xffffff,
				8
			);

		sun.position.set(5, 3, 5);

		this.scene.add(sun);

		const ambient =
			new THREE.AmbientLight(
				0xffffff,
				0.3
			);

		this.scene.add(ambient);

		// =====================================
		// EARTH
		// =====================================

		const loader =
			new THREE.TextureLoader();

		const earthTexture =
			loader.load(
				"/textures/8081_earthlights4k.jpg"
			);

		this.earth =
			new THREE.Mesh(

				new THREE.SphereGeometry(
					1,
					64,
					64
				),

				new THREE.MeshStandardMaterial({

					map: earthTexture
				})
			);

		this.scene.add(this.earth);

		// =====================================
		// ORBIT PARAMETERS
		// =====================================

		this.earthRadius = 1;

		this.orbitRadius =
			this.earthRadius +
			this.state.altitude;

		this.orbitPeriod =
			this.state.orbitPeriod;

		this.angularVelocity =
			(2 * Math.PI) /
			(this.orbitPeriod * 60);

		this.earthAngularVelocity =
			(2 * Math.PI) /
			(24 * 3600);

		this.inclination =
			this.state.inclination *
			Math.PI / 180;

		// =====================================
		// STORAGE
		// =====================================

		this.satellites = [];

		this.orbitLines = [];

		// =====================================
		// BUILD CONSTELLATION
		// =====================================

		this.rebuildConstellation();

		// =====================================
		// MISSILE STRIKE RINGS
		// =====================================

		this.missileStrikeRings = [];

		// =====================================================
		// MULTI CARRIER SYSTEM
		// Replace your SINGLE carrier section with this version
		// =====================================================

		// =====================================
		// MULTI CARRIER STORAGE
		// =====================================

		this.carriers = [];

		// =====================================================
		// ADD CARRIER HELPER
		// =====================================================

		this.addCarrier = ({
			name = "Carrier",
			lat = 0,
			lon = 0,
			color = "blue",
			strikeRadiusKm = 2000,
			defenseRadiusKm = 460
		}) => {

			// =================================
			// CARRIER BODY
			// =================================

			const carrierMesh =
				new THREE.Mesh(

					new THREE.BoxGeometry(
						0.002,
						0.006,
						0.001
					),

					new THREE.MeshBasicMaterial({

						color
					})
				);

			this.scene.add(
				carrierMesh
			);

			// =================================
			// STRIKE RING
			// =================================

			const strikeRadius =
				(strikeRadiusKm / 6371);

			const strikeRing =
				new THREE.Mesh(

					new THREE.RingGeometry(

						strikeRadius,

						strikeRadius + 0.001,

						64
					),

					new THREE.MeshBasicMaterial({

						color: "blue",

						side:
							THREE.DoubleSide,

						transparent: true,

						opacity: 0.9
					})
				);

			this.scene.add(
				strikeRing
			);

			// =================================
			// DEFENSE RING
			// =================================

			const defenseRadius =
				(defenseRadiusKm / 6371);

			const defenseRing =
				new THREE.Mesh(

					new THREE.RingGeometry(

						defenseRadius,

						defenseRadius + 0.001,

						64
					),

					new THREE.MeshBasicMaterial({

						color: "red",

						side:
							THREE.DoubleSide,

						transparent: true,

						opacity: 0.55
					})
				);

			this.scene.add(
				defenseRing
			);

			strikeRing.visible = false;
			defenseRing.visible = false;


			// =================================
			// SAVE
			// =================================

			this.carriers.push({

				name,

				lat,

				lon,

				mesh:
					carrierMesh,

				strikeRing,

				defenseRing
			});
		};

		// =====================================================
		// ADD MULTIPLE CARRIERS
		// ONLY COORDINATES REQUIRED
		// =====================================================

		this.addCarrier({

			name:
				"USS Abraham Lincoln",

			lat:
				21.888884087895217,

			lon:
				62.8574839512631,

			color:
				"red"
		});

		this.addCarrier({

			name:
				"USS George Washington",

			lat: 14.176850031295444,

			lon: 56.58082734000118,

			color:
				"red"
		});

		this.addCarrier({

			name:
				"USS George W Bush",

			lat:
				32.67233737126122,  

			lon:
				33.360104839617364,

			color:
				"lime"
		});

		// this.addCarrier({

		// 	name:
		// 		"Carrier Group Delta",

		// 	lat:
		// 		14.5,

		// 	lon:
		// 		72.0,

		// 	color:
		// 		"magenta"
		// });

		// =====================================
		// SIMULATED MISSILE CITIES
		// =====================================

		this.missileCities = [];

		// =====================================
		// COORDINATES
		// =====================================

		// 33°30'04.70"N
		const missileLat =
			this.dmsToDecimal(
				27,
				38,
				15.0,
				"N"
			);

		// 48°17'01.26"E
		const missileLon =
			this.dmsToDecimal(
				54,
				15,
				20.9,
				"E"
			);

		// second simulated site
		const missileLat2 =
			missileLat + 6;

		const missileLon2 =
			missileLon - 6;

		const missileSites = [

			{
				lat: missileLat,
				lon: missileLon
			},

			{
				lat: missileLat2,
				lon: missileLon2
			}
		];

		// =====================================
		// CREATE TRIANGLES
		// =====================================

		missileSites.forEach((site) => {

			const triangleShape =
				new THREE.Shape();

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

			const geometry =
				new THREE.ShapeGeometry(
					triangleShape
				);

			const material =
				new THREE.MeshBasicMaterial({

					color: "yellow",

					side:
						THREE.DoubleSide
				});

			const marker =
				new THREE.Mesh(
					geometry,
					material
				);

			this.scene.add(marker);

			this.missileCities.push({

				mesh: marker,

				lat: site.lat,

				lon: site.lon
			});
		});

		// =====================================
		// CREATE MISSILE STRIKE RINGS
		// =====================================

		missileSites.forEach((site) => {

			this.createMissileStrikeRing({

				lat: site.lat,
				lon: site.lon,
				rangeKm:
					parseFloat(
						this.state.selectedMissile.range
					),

				color: "yellow"
			});
		});

		// =====================================
		// KHEIBAR SHEKAN SIMULATION
		// =====================================

		// launch at 12:00 UTC
		this.missileLaunchTime =
			new Date(
				"2026-03-01T12:00:00Z"
			).getTime();

		// missile parameters
		this.missileSpeedKmS = 3.5;

		this.missileRangeKm = 1450;

		// approximate flight duration
		this.missileFlightDuration =
			(this.missileRangeKm /
			this.missileSpeedKmS) * 1000;

		// launch site
		this.missileLaunchLat =
			missileLat;

		this.missileLaunchLon =
			missileLon;

		// missile object
		this.kheibarMissile =
			new THREE.Mesh(

				new THREE.SphereGeometry(
					0.001,
					12,
					12
				),

				new THREE.MeshBasicMaterial({

					color: "yellow"
				})
			);

		this.scene.add(
			this.kheibarMissile
		);

		this.kheibarMissile.visible = false;

		// trajectory line
		this.missileTrailPoints = [];

		this.missileTrailGeometry =
			new THREE.BufferGeometry();

		this.missileTrailMaterial =
			new THREE.LineBasicMaterial({

				color: "orange",

				transparent: true,

				opacity: 1
			});

		this.missileTrail =
			new THREE.Line(

				this.missileTrailGeometry,

				this.missileTrailMaterial
			);

		this.scene.add(
			this.missileTrail
		);

		// =====================================
		// TIMING
		// =====================================

		this.currentSimBaseTime =
			this.warStart.getTime();

		this.startTime =
			Date.now();

		// =====================================
		// ANIMATION LOOP
		// =====================================

		const animate = () => {

			this.animationId =
				requestAnimationFrame(
					animate
				);

			let simTime;

			if (
				this.state
					.isDraggingTimeline
			){

				simTime =
					this.manualSimTime;

			} else {

				const elapsedRealSeconds =
					(Date.now() -
					this.startTime) / 1000;

				const simulatedMs =
					elapsedRealSeconds *
					this.simMinutesPerSecond *
					60 *
					1000;

				simTime =
					this.currentSimBaseTime +
					simulatedMs;
			}

			const simDate =
				new Date(simTime);

			const progress =
				(
					simTime -
					this.warStart.getTime()
				) /
				this.totalWarDuration;

			this.setState({

				timeT:
					simDate.toUTCString(),

				simProgress:
					progress
			});

			const t =
				(
					simTime -
					this.warStart.getTime()
				) / 1000;

			// =================================
			// EARTH ROTATION
			// =================================

			this.earth.rotation.y =
				this.earthAngularVelocity * t;

			// =================================
			// GEO SUPPORT
			// =================================

			let baseAngle;

			if (
				this.state.orbitPeriod ===
				1440
			){

				baseAngle =
					-this.earthAngularVelocity * t;

			} else {

				baseAngle =
					this.angularVelocity * t;
			}

			// =================================
			// MULTI CARRIERS
			// =================================

			this.carriers.forEach((carrier, index) => {

				// =============================
				// CARRIER POSITION
				// =============================

				const carrierPos =
					this.latLonToVector3(

						carrier.lat,

						carrier.lon,

						this.earthRadius +
						0.003
					);

				carrierPos.applyAxisAngle(

					new THREE.Vector3(0,1,0),

					this.earth.rotation.y
				);

				carrier.mesh.position.copy(
					carrierPos
				);

				carrier.mesh.lookAt(
					0,
					0,
					0
				);

				// =============================
				// STRIKE RING
				// =============================

				const ringPos =
					this.latLonToVector3(

						carrier.lat,

						carrier.lon,

						this.earthRadius +
						0.001
					);

				ringPos.applyAxisAngle(

					new THREE.Vector3(0,1,0),

					this.earth.rotation.y
				);

				carrier.strikeRing.position.copy(
					ringPos
				);

				carrier.strikeRing.lookAt(
					0,
					0,
					0
				);

				// =============================
				// DEFENSE RING
				// =============================

				carrier.defenseRing.position.copy(
					ringPos
				);

				carrier.defenseRing.lookAt(
					0,
					0,
					0
				);


				const isSelected =
					index ===
					this.state.selectedCarrierIndex;

				carrier.strikeRing.visible =
					isSelected;

				carrier.defenseRing.visible =
					isSelected;

				// =============================
				// PULSE EFFECT
				// =============================

				const pulse =
					1 +
					(Math.sin(
						(t * 0.004) +
						index
					) * 0.05);

				carrier.defenseRing.scale.set(

					pulse,

					pulse,

					pulse
				);
			});

			
			// =================================
			// MISSILE CITY MARKERS
			// =================================

			this.missileCities.forEach((site) => {

				const pos =
					this.latLonToVector3(

						site.lat,

						site.lon,

						this.earthRadius +
						0.004
					);

				pos.applyAxisAngle(

					new THREE.Vector3(0,1,0),

					this.earth.rotation.y
				);

				site.mesh.position.copy(pos);

				site.mesh.lookAt(
					0,
					0,
					0
				);

				// slow pulse

				const pulse =
					1 +
					(Math.sin(t * 0.003) * 0.15);

				site.mesh.scale.set(

					pulse,

					pulse,

					pulse
				);
			});

			// =================================
			// KHEIBAR SHEKAN FLIGHT
			// =================================

			if (
				simTime >=
				this.missileLaunchTime
			){
				this.kheibarMissile.visible = true

				const elapsedMissileTime =
					simTime -
					this.missileLaunchTime;

				let missileProgress =
					elapsedMissileTime /
					this.missileFlightDuration;

				// clamp
				missileProgress =
					Math.min(
						Math.max(
							missileProgress,
							0
						),
						1
					);

				// launch position
				const launchVec =
					this.latLonToVector3(

						this.missileLaunchLat,

						this.missileLaunchLon,

						this.earthRadius +
						0.01
					);

				// =================================
				// TARGET CARRIER
				// =================================

				const targetCarrier = this.carriers[this.state.selectedCarrierIndex];

				const targetVec =
					this.latLonToVector3(

						targetCarrier.lat,

						targetCarrier.lon,

						this.earthRadius + 0.01
					);


				// earth rotation
				launchVec.applyAxisAngle(

					new THREE.Vector3(0,1,0),

					this.earth.rotation.y
				);

				targetVec.applyAxisAngle(

					new THREE.Vector3(0,1,0),

					this.earth.rotation.y
				);

				// interpolate
				const missilePos =
					new THREE.Vector3()
					.lerpVectors(

						launchVec,

						targetVec,

						missileProgress
					);

				// ballistic altitude arc
				const arcHeight =
					Math.sin(
						Math.PI *
						missileProgress
					) * 0.25;

				missilePos.normalize();

				missilePos.multiplyScalar(

					this.earthRadius +
					0.01 +
					arcHeight
				);

				// set missile position
				this.kheibarMissile.position.copy(
					missilePos
				);

				// orient missile
				this.kheibarMissile.lookAt(
					targetVec
				);

				// trail
				this.missileTrailPoints.push(

					missilePos.clone()
				);

				// limit trail size
				if (
					this.missileTrailPoints.length >
					400
				){

					this.missileTrailPoints.shift();
				}

				this.missileTrailGeometry.setFromPoints(

					this.missileTrailPoints
				);
			} else {
				this.kheibarMissile.visible = false;
			}

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

			// =================================
			// SATELLITES
			// =================================

			this.satellites.forEach((sat) => {

				const angle =
					baseAngle +
					sat.phase;

				let x =
					this.orbitRadius *
					Math.cos(angle);

				let y = 0;

				let z =
					this.orbitRadius *
					Math.sin(angle);

				// inclination

				const cosI =
					Math.cos(
						this.inclination
					);

				const sinI =
					Math.sin(
						this.inclination
					);

				let yInclined =
					y * cosI -
					z * sinI;

				let zInclined =
					y * sinI +
					z * cosI;

				// RAAN

				const cosR =
					Math.cos(
						sat.raan
					);

				const sinR =
					Math.sin(
						sat.raan
					);

				let xFinal =
					x * cosR -
					zInclined * sinR;

				let zFinal =
					x * sinR +
					zInclined * cosR;

				// SAT POSITION

				sat.mesh.position.set(

					xFinal,

					yInclined,

					zFinal
				);

				const direction =
					new THREE.Vector3(

						xFinal,

						yInclined,

						zFinal

					).normalize();

				// =================================
				// GEO FOOTPRINT
				// =================================

				if (
					this.state.orbitPeriod ===
					1440
				){

					const geoGroundPos =
						direction.multiplyScalar(

							this.earthRadius +
							0.002
						);

					sat.footprint.position.copy(
						geoGroundPos
					);

					sat.footprint.lookAt(
						0,
						0,
						0
					);

					const geoCoverageKm =
						18000;

					const geoScale =
						(geoCoverageKm / 6371) * 6;

					sat.footprint.scale.set(

						geoScale,

						geoScale,

						geoScale
					);

					sat.footprint.material.color.set(
						"yellow"
					);

					sat.footprint.material.opacity =
						0.10;

				} else {

					// =================================
					// LEO FOOTPRINT
					// =================================

					const groundPos =
						direction.multiplyScalar(

							this.earthRadius +
							0.001
						);

					sat.footprint.position.copy(
						groundPos
					);

					sat.footprint.lookAt(
						0,
						0,
						0
					);

					sat.footprint.scale.set(
						1,
						1,
						1
					);

					sat.footprint.material.color.set(
						this.state.satColor
					);

					sat.footprint.material.opacity =
						0.25;

					// =====================================
					// CARRIER DETECTION
					// =====================================

					this.carriers.forEach((carrier) => {

						// carrier ground position
						const carrierGroundPos =
							this.latLonToVector3(

								carrier.lat,
								carrier.lon,

								this.earthRadius +
								0.001
							);

						carrierGroundPos.applyAxisAngle(

							new THREE.Vector3(0,1,0),

							this.earth.rotation.y
						);

						// distance between sat footprint and carrier
						const dist =
							groundPos.distanceTo(
								carrierGroundPos
							);

						// detection threshold
						// adjust this value
						const detectionRadius = 0.08;

						if (dist < detectionRadius){
							const gmtTime =
								new Date(simTime)
								.toUTCString();

							let message = `
								${gmtTime}
								${carrier.name} [DETECTED] 
								Lat ${carrier.lat}
								Lon ${carrier.lon}
									`;

							console.log(message);

							this.updateTargetingData(
								message
							);
						}
					});
				}
			});

			this.controls.update();

			this.renderer.render(

				this.scene,

				this.camera
			);
		};

		animate();

		// =====================================
		// RESIZE
		// =====================================

		this.handleResize = () => {

			this.camera.aspect =
				mount.clientWidth /
				mount.clientHeight;

			this.camera.updateProjectionMatrix();

			this.renderer.setSize(

				mount.clientWidth,

				mount.clientHeight
			);
		};

		window.addEventListener(

			"resize",

			this.handleResize
		);
	}

	// =====================================================
	// REBUILD
	// =====================================================

	rebuildConstellation(){

		if (this.satellites){

			this.satellites.forEach((sat) => {

				this.scene.remove(
					sat.mesh
				);

				this.scene.remove(
					sat.footprint
				);
			});
		}

		if (this.orbitLines){

			this.orbitLines.forEach((line) => {

				this.scene.remove(line);
			});
		}

		this.satellites = [];

		this.orbitLines = [];

		const numberOfPlanes =
			this.state.numberOfPlanes;

		const satsPerPlane =
			this.state.satsPerPlane;

		const targetingRAAN =
			-80 * Math.PI / 180;

		const spread =
			40 * Math.PI / 180;

		for (let p = 0; p < numberOfPlanes; p++){

			let raan;

			if (numberOfPlanes === 1){

				raan =
					targetingRAAN;

			} else {

				const offset =
					(
						p /
						(numberOfPlanes - 1)
					) - 0.5;

				raan =
					targetingRAAN +
					offset * spread;
			}

			this.addPlane({

				sats: satsPerPlane,

				raan
			});
		}
	}

	// =====================================================
	// APPLY ORBIT
	// =====================================================

	applyOrbitParameters(){

		this.orbitRadius =
			this.earthRadius +
			this.state.altitude;

		this.inclination =
			this.state.inclination *
			Math.PI / 180;

		this.orbitPeriod =
			this.state.orbitPeriod;

		this.angularVelocity =
			(2 * Math.PI) /
			(this.orbitPeriod * 60);
	}

	// =====================================================
	// SELECT SAT
	// =====================================================

	selectSat(event){

		const constellation =
			event.target.dataset.satid;

		// =====================================
		// ICEYE
		// =====================================

		if (
			constellation ===
			"ICEYE_LEO"
		){

			this.camera.position.set(
				0,
				1.5,
				3
			);

			this.setState({

				satColor: "blue",

				altitude: 0.089,

				inclination: 97.7,

				orbitPeriod: 96,

				satSize: 0.006,

				numberOfPlanes: 3,

				satsPerPlane: 7,

				selectedSatellite: {

					name: "ICEYE SAR",

					image:
						"/satellites/iceye.jpg",

					operator:
						"ICEYE Finland",

					orbit:
						"LEO Sun-Synchronous",

					altitude:
						"570 km",

					resolution:
						"25 cm - 1 m SAR",

					revisit:
						"3-4 hours",

					role:
						"Synthetic Aperture Radar"
				}

			}, () => {

				this.applyOrbitParameters();

				this.rebuildConstellation();
			});
		}

		// =====================================
		// GAOFEN-4
		// =====================================

		else if (
			constellation ===
			"GAOFEN4_GEO"
		){

			this.camera.position.set(
				2,
				3,
				10
			);

			this.setState({

				satColor: "red",

				altitude: 5.617,

				inclination: 0.0,

				orbitPeriod: 1440,

				satSize: 0.03,

				numberOfPlanes: 1,

				satsPerPlane: 1,

				selectedSatellite: {

					name: "Gaofen-4",

					image:
						"/satellites/gaofen4.jpg",

					operator:
						"CNSA",

					orbit:
						"Geostationary GEO",

					altitude:
						"35,786 km",

					resolution:
						"50 m optical",

					revisit:
						"20 sec regional scan",

					role:
						"Persistent ISR / EO"
				}

			}, () => {

				this.applyOrbitParameters();

				this.angularVelocity =
					this.earthAngularVelocity;

				this.rebuildConstellation();
			});
		}

		// =====================================
		// YAOGAN
		// =====================================

		else if (
			constellation ===
			"YAOGAN_LEO"
		){

			this.camera.position.set(
				0,
				1.5,
				3
			);

			this.setState({

				satColor: "lime",

				altitude: 0.11,

				inclination: 98,

				orbitPeriod: 98,

				satSize: 0.008,

				numberOfPlanes: 8,

				satsPerPlane: 5,

				selectedSatellite: {

					name: "Yaogan",

					image:
						"/satellites/yaogan.jpg",

					operator:
						"PLA Strategic Support Force",

					orbit:
						"LEO Reconnaissance",

					altitude:
						"700 km",

					resolution:
						"Sub-meter EO/SAR",

					revisit:
						"High constellation revisit",

					role:
						"Military ISR"
				}

			}, () => {

				this.applyOrbitParameters();

				this.rebuildConstellation();
			});
		}
	}

	// SELECT CARRIER
	selectCarrier(index){
		this.setState({
			selectedCarrierIndex: index
		});
	}

	// SELECT MISSILE
	selectMissile(missile){
		this.setState({

			selectedMissile: missile
		});

		// =====================================
		// UPDATE MISSILE PARAMETERS
		// =====================================

		this.missileSpeedKmS =
			parseFloat(
				missile.speed
			);

		this.missileRangeKm =
			parseFloat(
				missile.range
			);

		this.missileFlightDuration =
			(this.missileRangeKm /
			this.missileSpeedKmS) * 1000;

		// =====================================
		// REMOVE OLD STRIKE RINGS
		// =====================================

		this.missileStrikeRings.forEach((ringObj) => {

			this.scene.remove(
				ringObj.mesh
			);
		});

		this.missileStrikeRings = [];

		// =====================================
		// REBUILD NEW RINGS
		// =====================================

		this.missileCities.forEach((site) => {

			this.createMissileStrikeRing({

				lat: site.lat,
				lon: site.lon,

				rangeKm:
					this.missileRangeKm,

				color: "yellow"
			});
		});
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

		const radius =
			(rangeKm / 6371);

		const ring =
			new THREE.Mesh(

				new THREE.RingGeometry(

					radius,
					radius + 0.003,
					128
				),

				new THREE.MeshBasicMaterial({

					color,

					side:
						THREE.DoubleSide,

					transparent: true,

					opacity: 0.25
				})
			);

		this.scene.add(ring);

		this.missileStrikeRings.push({

			lat,
			lon,
			mesh: ring
		});
	}

	// =====================================================
	// TIMELINE
	// =====================================================

	updateTimeline(event){

		const progress =
			parseFloat(
				event.target.value
			);

		const simTime =
			this.warStart.getTime() +
			(progress *
			this.totalWarDuration);

		this.manualSimTime =
			simTime;

		this.setState({

			simProgress:
				progress,

			timeT:
				new Date(simTime)
				.toUTCString()
		});
	}

	startTimelineDrag(){

		this.setState({

			isDraggingTimeline:
				true
		});
	}

	endTimelineDrag(){

		this.currentSimBaseTime =
			this.manualSimTime;

		this.startTime =
			Date.now();

		this.setState({

			isDraggingTimeline:
				false
		});
	}


	// =====================================================
	// UPDATE TARGETING DATA
	// =====================================================
	updateTargetingData(message){
		this.setState({
			detectionMessages: [message, ...this.state.detectionMessages]
		})
	}


	// =====================================================
	// LIFECYCLE
	// =====================================================

	componentDidMount(){

		this.startEnvironment();
	}

	componentWillUnmount(){

		cancelAnimationFrame(
			this.animationId
		);

		window.removeEventListener(

			"resize",

			this.handleResize
		);

		if (this.renderer){

			this.renderer.dispose();
		}
	}

	// =====================================================
	// RENDER
	// =====================================================

	render(){

		return (

			<div className={styles.container}>

				{/* ================================= */}
				{/* SAT INFO PANEL */}
				{/* ================================= */}

				<div className={styles.satInfoPanel}>

					<img

						src={
							this.state
							.selectedSatellite
							.image
						}

						className={
							styles.satImage
						}
					/>

					<div
						className={
							styles.satName
						}
					>

						{
							this.state
							.selectedSatellite
							.name
						}
					</div>

					<div
						className={
							styles.satSpec
						}
					>
						<div>

							<span>
								Operator:
							</span>

							{
								this.state
								.selectedSatellite
								.operator
							}

						</div>

						<div>

							<span>
								Orbit:
							</span>

							{
								this.state
								.selectedSatellite
								.orbit
							}

						</div>

						<div>

							<span>
								Altitude:
							</span>

							{
								this.state
								.selectedSatellite
								.altitude
							}

						</div>

						<div>

							<span>
								Resolution:
							</span>

							{
								this.state
								.selectedSatellite
								.resolution
							}

						</div>

						<div>

							<span>
								Revisit:
							</span>

							{
								this.state
								.selectedSatellite
								.revisit
							}

						</div>

						<div>

							<span>
								Role:
							</span>

							{
								this.state
								.selectedSatellite
								.role
							}

						</div>

					</div>

				</div>

				{/* ================================= */}
				{/* MISSILE INFO PANEL */}
				{/* ================================= */}

				<div className={styles.missileInfoPanel}>

					<img

						src={
							this.state
							.selectedMissile
							.image
						}

						className={
							styles.satImage
						}
					/>

					<div
						className={
							styles.satName
						}
					>

						{
							this.state
							.selectedMissile
							.name
						}

					</div>

					<div
						className={
							styles.satSpec
						}
					>

						<div>

							<span>Type:</span>

							{
								this.state
								.selectedMissile
								.type
							}

						</div>

						<div>

							<span>Speed:</span>

							{
								this.state
								.selectedMissile
								.speed
							}

						</div>

						<div>

							<span>Range:</span>

							{
								this.state
								.selectedMissile
								.range
							}

						</div>

						<div>

							<span>Guidance:</span>

							{
								this.state
								.selectedMissile
								.homing
							}

						</div>

						<div>

							<span>Warhead:</span>

							{
								this.state
								.selectedMissile
								.warhead
							}

						</div>

						<div>

							<span>Role:</span>

							{
								this.state
								.selectedMissile
								.role
							}

						</div>

					</div>

				</div>

				<div

					ref={this.simRef}

					className={styles.satSim}
				/>

				{/*** SIMULATION CLOCK ***/}

				<div
					className={
						styles.overlayInfo
					}
				>

					<div
						className={
							styles.title
						}
					>

						<div>
							Iranian War March 2026
						</div>

						<div>
							{this.state.timeT}
						</div>

					</div>

				</div>

				{/*** TIMELINE SELECTION ***/}
				<div
					className={
						styles.timelineContainer
					}
				>

					<input

						type="range"

						min="0"

						max="1"

						step="0.0001"

						value={
							this.state.simProgress
						}

						onChange={
							this.updateTimeline
						}

						onMouseDown={
							this.startTimelineDrag
						}

						onMouseUp={
							this.endTimelineDrag
						}

						className={
							styles.timelineSlider
						}
					/>

				</div>

				{/*** SATELLITE SELECTION ***/}

				<div
					className={
						styles.hoangControl
					}
				>

					<div

						className={
							styles.satSelector
						}

						onClick={
							this.selectSat
						}

						data-satid="ICEYE_LEO"
					>

						ICEYE LEO

					</div>

					<div

						className={
							styles.satSelector
						}

						onClick={
							this.selectSat
						}

						data-satid="GAOFEN4_GEO"
					>

						GaoFen 4 GEO

					</div>

					<div

						className={
							styles.satSelector
						}

						onClick={
							this.selectSat
						}

						data-satid="YAOGAN_LEO"
					>

						YaoGan LEO

					</div>

					{
						this.state.missiles.map((missile, index) => {
							return (
								<div

									key={index}

									className={styles.missileSelector}

									onClick={() =>
										this.selectMissile(missile)
									}
								>

									{missile.name}

								</div>
							);
						})
					}

				</div>


				{/* ================================= */}
				{/* CARRIER SELECTOR */}
				{/* ================================= */}

				<div className={styles.carrierControls}>
					{
						this.carriers &&
						this.carriers.map((carrier, index) => (

							<div

								key={index}

								className={styles.carrierSelector}

								onClick={() =>
									this.selectCarrier(index)
								}
							>

								{carrier.name}

							</div>
						))
					}
				</div>



				<div className={styles.detectionMessages}>
					{
						this.state.detectionMessages.map(message => {
							return (
								<div className={styles.detectionEvent}>
									{message}
								</div>
							)
						})
					}
				</div>

				

				

			</div>
		);
	}
}