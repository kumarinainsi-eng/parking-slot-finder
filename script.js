/* =========================================================
   PARKEASE - SMART PARKING
   Complete JavaScript
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       STATE
    ===================================================== */

    const state = {
        floor: 1,
        vehicle: "car",
        filter: "all",
        selectedSlot: null,
        recommendedSlot: null,
        heatmap: false,
        lights: true,
        cctv: false,
        routeActive: false,
        zoom: 1,
        rushHour: false,
        bookings: JSON.parse(localStorage.getItem("parkEaseBookings") || "[]")
    };


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const leftSlots = document.getElementById("leftSlots");
    const rightSlots = document.getElementById("rightSlots");

    const availableCount = document.getElementById("availableCount");
    const occupiedCount = document.getElementById("occupiedCount");
    const reservedCount = document.getElementById("reservedCount");
    const evCount = document.getElementById("evCount");

    const heroAvailable = document.getElementById("heroAvailable");
    const pulseAvailable = document.getElementById("pulseAvailable");
    const pulseOccupied = document.getElementById("pulseOccupied");

    const parkingMap = document.getElementById("parkingMap");
    const mapFloor = document.getElementById("mapFloor");

    const slotPanel = document.getElementById("slotPanel");
    const emptySlotState = document.getElementById("emptySlotState");
    const selectedSlotContent = document.getElementById("selectedSlotContent");

    const detailTitle = document.getElementById("detailTitle");
    const detailSlotId = document.getElementById("detailSlotId");
    const detailStatus = document.getElementById("detailStatus");
    const detailPrice = document.getElementById("detailPrice");
    const detailDistance = document.getElementById("detailDistance");
    const detailWalk = document.getElementById("detailWalk");
    const detailSecurity = document.getElementById("detailSecurity");
    const detailZone = document.getElementById("detailZone");
    const detailLighting = document.getElementById("detailLighting");
    const detailExit = document.getElementById("detailExit");
    const detailVehicle = document.getElementById("detailVehicle");

    const routeButton = document.getElementById("routeButton");
    const reserveButton = document.getElementById("reserveButton");

    const routeProgress = document.getElementById("routeProgress");
    const progressBar = document.getElementById("progressBar");
    const routePercent = document.getElementById("routePercent");
    const routeMessage = document.getElementById("routeMessage");

    const navigationRoute = document.getElementById("navigationRoute");

    const copilotText = document.getElementById("copilotText");

    const toast = document.getElementById("toast");
    const toastTitle = document.getElementById("toastTitle");
    const toastMessage = document.getElementById("toastMessage");

    const demoModal = document.getElementById("demoModal");


    /* =====================================================
       PARKING DATA
    ===================================================== */

    const zoneNames = [
        "Quick Lane",
        "Quiet Deck",
        "Flex Zone",
        "Central Bay"
    ];

    const slotData = [];

    const initialOccupied = [
        2, 5, 9, 12, 15, 18, 21, 24,
        27, 30, 34, 37, 40, 43, 46, 49,
        52, 56, 59, 62, 65, 68, 71
    ];

    const initialReserved = [
        4, 11, 22, 35, 48, 55, 64, 70
    ];

    const evSlots = [
        7, 14, 25, 32, 39, 51, 58, 66
    ];

    for (let i = 1; i <= 72; i++) {

        const floor = Math.ceil(i / 24);
        const localNumber = ((i - 1) % 24) + 1;

        let rowLetter;

        if (localNumber <= 12) {
            rowLetter = "A";
        } else {
            rowLetter = "B";
        }

        const slotNumber = String(localNumber).padStart(2, "0");

        let status = "available";

        if (initialOccupied.includes(i)) {
            status = "occupied";
        }

        if (initialReserved.includes(i)) {
            status = "reserved";
        }

        const isEV = evSlots.includes(i);

        const distance = 18 + ((i * 13) % 70);

        const zone = zoneNames[(i + floor) % zoneNames.length];

        const exit = i % 2 === 0 ? "Exit B" : "Exit A";

        const price = isEV
            ? 50
            : floor === 3
                ? 35
                : 40;

        slotData.push({
            id: `F${floor}-${rowLetter}${slotNumber}`,
            floor,
            number: localNumber,
            status,
            type: isEV ? "ev" : (i % 5 === 0 ? "bike" : "car"),
            zone,
            distance,
            walk: Math.max(1, Math.ceil(distance / 35)),
            security: i % 4 === 0 ? "CCTV + Guard" : "CCTV",
            lighting: i % 3 === 0 ? "Bright" : "Well Lit",
            exit,
            price,
            ev: isEV,
            quiet: zone === "Quiet Deck",
            fastExit: distance < 40 || exit === "Exit B"
        });
    }


    /* =====================================================
       UTILITY
    ===================================================== */

    function getFloorSlots() {
        return slotData.filter(slot => slot.floor === state.floor);
    }


    function getAvailableSlots() {
        return slotData.filter(slot => slot.status === "available");
    }


    function formatVehicle(vehicle) {
        if (vehicle === "ev") return "EV";
        if (vehicle === "bike") return "Bike";
        return "Car";
    }


    function showToast(title, message) {

        toastTitle.textContent = title;
        toastMessage.textContent = message;

        toast.classList.add("show");

        clearTimeout(showToast.timer);

        showToast.timer = setTimeout(() => {
            toast.classList.remove("show");
        }, 3500);
    }


    /* =====================================================
       COUNTERS
    ===================================================== */

    function animateNumber(element, target) {

        const start = Number(element.textContent) || 0;
        const duration = 450;
        const startTime = performance.now();

        function update(time) {

            const progress = Math.min(
                (time - startTime) / duration,
                1
            );

            const value = Math.round(
                start + (target - start) * progress
            );

            element.textContent = value;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }


    function updateStats() {

        const available = slotData.filter(
            slot => slot.status === "available"
        ).length;

        const occupied = slotData.filter(
            slot => slot.status === "occupied"
        ).length;

        const reserved = slotData.filter(
            slot => slot.status === "reserved"
        ).length;

        const ev = slotData.filter(
            slot => slot.ev && slot.status === "available"
        ).length;

        animateNumber(availableCount, available);
        animateNumber(occupiedCount, occupied);
        animateNumber(reservedCount, reserved);
        animateNumber(evCount, ev);

        animateNumber(heroAvailable, available);
        animateNumber(pulseAvailable, available);
        animateNumber(pulseOccupied, occupied);
    }


    /* =====================================================
       SLOT RENDERING
    ===================================================== */

    function createSlotElement(slot) {

        const button = document.createElement("button");

        button.className = "parking-slot";

        button.dataset.id = slot.id;
        button.dataset.status = slot.status;

        if (slot.status === "occupied") {
            button.classList.add("occupied");
        }

        if (slot.status === "reserved") {
            button.classList.add("reserved");
        }

        if (slot.ev) {
            button.classList.add("ev-slot");
        }

        if (state.selectedSlot === slot.id) {
            button.classList.add("selected");
        }

        if (state.recommendedSlot === slot.id) {
            button.classList.add("recommended");
        }


        /* FILTER */

        let visible = true;

        if (state.filter === "available") {
            visible = slot.status === "available";
        }

        if (state.filter === "ev") {
            visible = slot.ev && slot.status === "available";
        }

        if (state.filter === "fast") {
            visible = slot.fastExit && slot.status === "available";
        }

        if (state.filter === "quiet") {
            visible = slot.quiet && slot.status === "available";
        }

        if (!visible) {
            button.classList.add("hidden-slot");
        }


        const statusLabel =
            slot.status === "available"
                ? "AVAILABLE"
                : slot.status === "occupied"
                    ? "OCCUPIED"
                    : "RESERVED";


        const car =
            slot.status === "occupied"
                ? (slot.type === "bike" ? "🏍️" : slot.ev ? "🚙" : "🚗")
                : "";


        button.innerHTML = `
            <span class="slot-status-light"></span>
            <span class="slot-number">${slot.id.replace("F" + slot.floor + "-", "")}</span>
            ${car ? `<span class="slot-car">${car}</span>` : ""}
            ${slot.ev ? `<span class="slot-ev-badge">⚡</span>` : ""}
        `;


        /* TOOLTIP */

        button.title =
            `${slot.id} • ${statusLabel} • ${slot.distance}m • ${slot.zone}`;


        /* CLICK */

        button.addEventListener("click", () => {

            if (slot.status !== "available") {

                showToast(
                    slot.status === "occupied"
                        ? "Slot Occupied"
                        : "Slot Reserved",
                    `${slot.id} is currently ${slot.status}.`
                );

                return;
            }

            selectSlot(slot.id);
        });


        /* HOVER */

        button.addEventListener("mouseenter", () => {
            copilotText.textContent =
                `${slot.id} • ${slot.distance}m from entry • ${slot.zone} • ${slot.security}`;
        });

        button.addEventListener("mouseleave", () => {

            if (!state.selectedSlot) {
                copilotText.textContent =
                    "Select your vehicle and I'll suggest a suitable available slot.";
            }
        });


        return button;
    }


    function renderSlots() {

        leftSlots.innerHTML = "";
        rightSlots.innerHTML = "";

        const floorSlots = getFloorSlots();

        floorSlots.forEach((slot, index) => {

            const element = createSlotElement(slot);

            if (index < 12) {
                leftSlots.appendChild(element);
            } else {
                rightSlots.appendChild(element);
            }
        });

        mapFloor.textContent = String(state.floor).padStart(2, "0");

        updateStats();
    }


    /* =====================================================
       SELECT SLOT
    ===================================================== */

    function selectSlot(id) {

        const slot = slotData.find(item => item.id === id);

        if (!slot) return;

        state.selectedSlot = id;

        state.recommendedSlot = null;

        state.routeActive = false;

        navigationRoute.classList.remove("active");
        routeProgress.classList.remove("active");

        slotPanel.classList.add("has-selection");

        detailTitle.textContent = slot.id;
        detailSlotId.textContent = slot.id.replace(`F${slot.floor}-`, "");

        detailStatus.textContent = slot.status.toUpperCase();

        detailStatus.className = "availability-pill";

        detailPrice.textContent = `₹${slot.price}`;

        detailDistance.textContent = `${slot.distance} m`;
        detailWalk.textContent = `${slot.walk} min`;
        detailSecurity.textContent = slot.security;
        detailZone.textContent = slot.zone;

        detailLighting.textContent =
            slot.lighting === "Bright"
                ? "💡 Brightly Lit"
                : "💡 Well Lit";

        detailExit.textContent =
            slot.exit === "Exit B"
                ? "↗ Exit B"
                : "↗ Exit A";

        detailVehicle.textContent =
            slot.ev
                ? "⚡ EV Ready"
                : slot.type === "bike"
                    ? "🏍️ Bike"
                    : "🚗 Car";

        reserveButton.textContent = "Mark for Parking";

        renderSlots();

        showToast(
            "Slot Selected",
            `${slot.id} is ${slot.distance}m from the entrance.`
        );
    }


    /* =====================================================
       VEHICLE SELECTION
    ===================================================== */

    document.querySelectorAll(".vehicle-option").forEach(button => {

        button.addEventListener("click", () => {

            document.querySelectorAll(".vehicle-option")
                .forEach(item => item.classList.remove("active"));

            button.classList.add("active");

            state.vehicle = button.dataset.vehicle;

            showToast(
                "Vehicle Updated",
                `${formatVehicle(state.vehicle)} parking selected.`
            );
        });
    });


    /* =====================================================
       FIND BEST SLOT
    ===================================================== */

    function findBestSlot() {

        let candidates = getAvailableSlots();

        if (state.vehicle === "ev") {
            candidates = candidates.filter(slot => slot.ev);
        }

        if (state.vehicle === "bike") {
            candidates = candidates.filter(
                slot => slot.type === "bike" || slot.type === "car"
            );
        }

        if (!candidates.length) {

            showToast(
                "No Match",
                "No suitable available slot was found."
            );

            return null;
        }


        candidates.sort((a, b) => {

            let scoreA = 100 - a.distance;
            let scoreB = 100 - b.distance;

            if (a.fastExit) scoreA += 15;
            if (b.fastExit) scoreB += 15;

            if (a.quiet) scoreA += 7;
            if (b.quiet) scoreB += 7;

            if (state.vehicle === "ev") {
                if (a.ev) scoreA += 50;
                if (b.ev) scoreB += 50;
            }

            return scoreB - scoreA;
        });

        return candidates[0];
    }


    function recommendSlot() {

        const best = findBestSlot();

        if (!best) return;

        state.floor = best.floor;
        state.recommendedSlot = best.id;

        state.filter = "all";

        document.querySelectorAll(".floor-tab").forEach(tab => {
            tab.classList.toggle(
                "active",
                Number(tab.dataset.floor) === state.floor
            );
        });

        document.querySelectorAll(".smart-filter").forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.filter === "all"
            );
        });

        renderSlots();

        selectSlot(best.id);

        state.recommendedSlot = best.id;

        renderSlots();

        copilotText.innerHTML =
            `<strong>${best.id}</strong> is my recommendation — ${best.distance}m from entry, ${best.zone}, ${best.security}.`;

        showToast(
            "Best Match Found",
            `${best.id} is recommended for your ${formatVehicle(state.vehicle)}.`
        );

        document.getElementById("parking").scrollIntoView({
            behavior: "smooth"
        });
    }


    document.getElementById("quickFindButton")
        .addEventListener("click", recommendSlot);

    document.getElementById("copilotButton")
        .addEventListener("click", recommendSlot);

    document.getElementById("nearestButton")
        .addEventListener("click", () => {

            state.vehicle = "car";

            const best = getAvailableSlots()
                .sort((a, b) => a.distance - b.distance)[0];

            if (best) {
                state.floor = best.floor;
                selectSlot(best.id);

                document.getElementById("parking").scrollIntoView({
                    behavior: "smooth"
                });
            }
        });


    /* =====================================================
       FLOOR SWITCH
    ===================================================== */

    document.querySelectorAll(".floor-tab").forEach(tab => {

        tab.addEventListener("click", () => {

            state.floor = Number(tab.dataset.floor);

            state.selectedSlot = null;
            state.recommendedSlot = null;

            slotPanel.classList.remove("has-selection");

            renderSlots();

            showToast(
                "Floor Changed",
                `Now viewing ${tab.textContent.trim()}.`
            );

            document.querySelectorAll(".floor-tab")
                .forEach(item => item.classList.remove("active"));

            tab.classList.add("active");
        });
    });


    /* =====================================================
       FILTERS
    ===================================================== */

    document.querySelectorAll(".smart-filter").forEach(button => {

        button.addEventListener("click", () => {

            state.filter = button.dataset.filter;

            document.querySelectorAll(".smart-filter")
                .forEach(item => item.classList.remove("active"));

            button.classList.add("active");

            renderSlots();

            const messages = {
                all: "Showing all parking spaces.",
                available: "Showing available parking spaces.",
                ev: "Showing EV-compatible spaces.",
                fast: "Showing spaces close to an exit.",
                quiet: "Showing quieter parking zones."
            };

            showToast(
                "Parking Filter",
                messages[state.filter]
            );
        });
    });


    /* =====================================================
       HEATMAP
    ===================================================== */

    document.getElementById("heatmapButton")
        .addEventListener("click", () => {

            state.heatmap = !state.heatmap;

            parkingMap.classList.toggle(
                "heatmap-active",
                state.heatmap
            );

            showToast(
                state.heatmap
                    ? "Heatmap Enabled"
                    : "Heatmap Disabled",
                state.heatmap
                    ? "Busy parking zones are highlighted."
                    : "Normal parking view restored."
            );
        });


    /* =====================================================
       LIGHTS
    ===================================================== */

    document.getElementById("lightsButton")
        .addEventListener("click", () => {

            state.lights = !state.lights;

            parkingMap.classList.toggle(
                "lights-off",
                !state.lights
            );

            showToast(
                "Parking Lights",
                state.lights
                    ? "Smart lights switched ON."
                    : "Smart lights switched OFF."
            );
        });


    /* =====================================================
       CCTV
    ===================================================== */

    document.getElementById("cctvButton")
        .addEventListener("click", () => {

            state.cctv = !state.cctv;

            document.querySelectorAll(".cctv")
                .forEach(camera => {
                    camera.style.transform =
                        state.cctv
                            ? "scale(1.12)"
                            : "";
                });

            showToast(
                "CCTV Monitor",
                state.cctv
                    ? "Simulated CCTV monitoring active."
                    : "CCTV focus mode closed."
            );
        });


    /* =====================================================
       ENTRY / EXIT
    ===================================================== */

    const entryGate = document.getElementById("entryGate");
    const exitGate = document.getElementById("exitGate");

    entryGate.addEventListener("click", () => {

        entryGate.classList.toggle("open");

        const open = entryGate.classList.contains("open");

        document.getElementById("entryStatus").textContent =
            open ? "OPEN" : "CLOSED";

        showToast(
            "Entry Gate",
            open
                ? "Entry gate opened."
                : "Entry gate closed."
        );
    });


    exitGate.addEventListener("click", () => {

        exitGate.classList.toggle("open");

        const open = exitGate.classList.contains("open");

        document.getElementById("exitStatus").textContent =
            open ? "OPEN" : "CLOSED";

        showToast(
            "Exit Gate",
            open
                ? "Exit gate opened."
                : "Exit gate closed."
        );
    });


    /* =====================================================
       NAVIGATION
    ===================================================== */

    routeButton.addEventListener("click", () => {

        if (!state.selectedSlot) {
            showToast(
                "Select a Slot",
                "Choose an available slot before starting navigation."
            );

            return;
        }

        state.routeActive = true;

        navigationRoute.classList.add("active");
        routeProgress.classList.add("active");

        let progress = 0;

        progressBar.style.width = "0%";
        routePercent.textContent = "0%";

        const routeSteps = [
            "Scanning entrance...",
            "Finding shortest internal route...",
            "Passing through parking lane...",
            "Approaching selected bay...",
            "You have reached your parking space."
        ];

        const timer = setInterval(() => {

            progress += 5;

            progressBar.style.width = `${progress}%`;
            routePercent.textContent = `${progress}%`;

            const index = Math.min(
                Math.floor(progress / 20),
                routeSteps.length - 1
            );

            routeMessage.textContent = routeSteps[index];

            if (progress >= 100) {

                clearInterval(timer);

                showToast(
                    "Destination Reached",
                    `${state.selectedSlot} is ready for parking.`
                );
            }

        }, 150);
    });


    /* =====================================================
       MARK FOR PARKING
    ===================================================== */

    reserveButton.addEventListener("click", () => {

        if (!state.selectedSlot) return;

        const slot = slotData.find(
            item => item.id === state.selectedSlot
        );

        if (!slot) return;

        if (slot.status !== "available") {

            showToast(
                "Unavailable",
                "This parking space is no longer available."
            );

            return;
        }

        slot.status = "reserved";

        state.bookings.push({
            slot: slot.id,
            floor: slot.floor,
            time: new Date().toISOString()
        });

        localStorage.setItem(
            "parkEaseBookings",
            JSON.stringify(state.bookings)
        );

        reserveButton.textContent = "Marked ✓";

        renderSlots();

        showToast(
            "Parking Marked",
            `${slot.id} has been marked for your parking journey.`
        );
    });


    /* =====================================================
       CLOSE PANEL
    ===================================================== */

    document.getElementById("closePanel")
        .addEventListener("click", () => {

            state.selectedSlot = null;
            state.recommendedSlot = null;

            slotPanel.classList.remove("has-selection");

            navigationRoute.classList.remove("active");
            routeProgress.classList.remove("active");

            renderSlots();
        });


    /* =====================================================
       RESET
    ===================================================== */

    document.getElementById("resetButton")
        .addEventListener("click", () => {

            state.floor = 1;
            state.vehicle = "car";
            state.filter = "all";
            state.selectedSlot = null;
            state.recommendedSlot = null;
            state.heatmap = false;
            state.lights = true;
            state.cctv = false;
            state.routeActive = false;
            state.rushHour = false;

            parkingMap.classList.remove(
                "heatmap-active",
                "lights-off"
            );

            navigationRoute.classList.remove("active");
            routeProgress.classList.remove("active");

            slotPanel.classList.remove("has-selection");

            document.querySelectorAll(".floor-tab")
                .forEach(tab => {
                    tab.classList.toggle(
                        "active",
                        tab.dataset.floor === "1"
                    );
                });

            document.querySelectorAll(".smart-filter")
                .forEach(button => {
                    button.classList.toggle(
                        "active",
                        button.dataset.filter === "all"
                    );
                });

            document.querySelectorAll(".vehicle-option")
                .forEach(button => {
                    button.classList.toggle(
                        "active",
                        button.dataset.vehicle === "car"
                    );
                });

            renderSlots();

            showToast(
                "Demo Reset",
                "Parking view returned to normal."
            );
        });


    /* =====================================================
       ZOOM
    ===================================================== */

    function updateZoom() {

        parkingMap.style.transform =
            `scale(${state.zoom})`;

        document.getElementById("zoomValue").textContent =
            `${Math.round(state.zoom * 100)}%`;
    }


    document.getElementById("zoomIn")
        .addEventListener("click", () => {

            state.zoom = Math.min(
                1.15,
                +(state.zoom + 0.05).toFixed(2)
            );

            updateZoom();
        });


    document.getElementById("zoomOut")
        .addEventListener("click", () => {

            state.zoom = Math.max(
                0.9,
                +(state.zoom - 0.05).toFixed(2)
            );

            updateZoom();
        });


    /* =====================================================
       RUSH HOUR SIMULATION
    ===================================================== */

    document.getElementById("rushButton")
        .addEventListener("click", () => {

            if (!state.rushHour) {

                state.rushHour = true;

                const available = slotData.filter(
                    slot => slot.status === "available"
                );

                available
                    .slice(0, 7)
                    .forEach(slot => {
                        slot.status = "occupied";
                    });

                document.getElementById("simulationFlow")
                    .textContent = "96%";

                document.getElementById("simulationStatus")
                    .textContent = "RUSH HOUR";

                document.getElementById("rushButton")
                    .innerHTML =
                    `Return to Normal <span>↻</span>`;

                addActivity(
                    "Rush-hour simulation started",
                    "Parking flow increased"
                );

                renderSlots();

                showToast(
                    "Rush Hour Started",
                    "Several parking spaces are now occupied."
                );

            } else {

                state.rushHour = false;

                slotData.forEach(slot => {

                    if (
                        slot.status === "occupied" &&
                        !initialOccupied.includes(
                            slotData.indexOf(slot) + 1
                        )
                    ) {
                        slot.status = "available";
                    }
                });

                document.getElementById("simulationFlow")
                    .textContent = "82%";

                document.getElementById("simulationStatus")
                    .textContent = "NORMAL";

                document.getElementById("rushButton")
                    .innerHTML =
                    `Start Rush Hour <span>↗</span>`;

                addActivity(
                    "Parking flow returned to normal",
                    "Simulation completed"
                );

                renderSlots();

                showToast(
                    "Normal Mode",
                    "Parking situation restored."
                );
            }
        });


    /* =====================================================
       ACTIVITY
    ===================================================== */

    function addActivity(title, subtitle) {

        const feed = document.getElementById("activityFeed");

        const item = document.createElement("div");

        item.className = "feed-item";

        item.innerHTML = `
            <span class="feed-icon purple-feed">✦</span>

            <div>
                <strong>${title}</strong>
                <small>${subtitle}</small>
            </div>

            <time>now</time>
        `;

        feed.prepend(item);

        const items = feed.querySelectorAll(".feed-item");

        if (items.length > 5) {
            items[items.length - 1].remove();
        }
    }


    /* =====================================================
       HERO DEMO MODAL
    ===================================================== */

    document.getElementById("heroDemoButton")
        .addEventListener("click", () => {

            demoModal.classList.add("active");
        });


    document.getElementById("modalClose")
        .addEventListener("click", () => {

            demoModal.classList.remove("active");
        });


    document.getElementById("modalStartButton")
        .addEventListener("click", () => {

            demoModal.classList.remove("active");

            document.getElementById("parking")
                .scrollIntoView({
                    behavior: "smooth"
                });

            setTimeout(() => {
                recommendSlot();
            }, 600);
        });


    demoModal.addEventListener("click", event => {

        if (event.target === demoModal) {
            demoModal.classList.remove("active");
        }
    });


    /* =====================================================
       TOAST CLOSE
    ===================================================== */

    document.getElementById("toastClose")
        .addEventListener("click", () => {

            toast.classList.remove("show");
        });


    /* =====================================================
       THEME
    ===================================================== */

    document.getElementById("themeButton")
        .addEventListener("click", () => {

            document.body.classList.toggle("light-mode");

            showToast(
                "Visual Mode",
                document.body.classList.contains("light-mode")
                    ? "Light visual mode enabled."
                    : "Dark visual mode enabled."
            );
        });


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    const menuButton = document.getElementById("menuButton");
    const mainNav = document.getElementById("mainNav");

    menuButton.addEventListener("click", () => {

        mainNav.classList.toggle("open");
    });


    document.querySelectorAll(".nav-link")
        .forEach(link => {

            link.addEventListener("click", () => {
                mainNav.classList.remove("open");
            });
        });


    /* =====================================================
       LIVE CLOCK
    ===================================================== */

    function updateClock() {

        const now = new Date();

        const time = now.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );

        document.getElementById("liveClock")
            .textContent = time;
    }

    updateClock();

    setInterval(updateClock, 1000);


    /* =====================================================
       SCROLL REVEAL
    ===================================================== */

    const revealElements =
        document.querySelectorAll(".reveal");

    const revealObserver =
        new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                    }

                });

            },
            {
                threshold: 0.12
            }
        );

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });


    /* =====================================================
       ACTIVE NAV ON SCROLL
    ===================================================== */

    const sections = document.querySelectorAll(
        "main section[id]"
    );

    const navLinks = document.querySelectorAll(
        ".nav-link"
    );

    window.addEventListener("scroll", () => {

        let current = "home";

        sections.forEach(section => {

            const sectionTop =
                section.offsetTop - 150;

            if (window.scrollY >= sectionTop) {
                current = section.id;
            }
        });

        navLinks.forEach(link => {

            link.classList.toggle(
                "active",
                link.getAttribute("href") === `#${current}`
            );
        });
    });


    /* =====================================================
       KEYBOARD SUPPORT
    ===================================================== */

    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            demoModal.classList.remove("active");
            toast.classList.remove("show");
        }

        if (
            event.key.toLowerCase() === "f" &&
            !["INPUT", "TEXTAREA"].includes(
                document.activeElement.tagName
            )
        ) {
            document.getElementById("parking")
                .scrollIntoView({
                    behavior: "smooth"
                });
        }
    });


    /* =====================================================
       INITIAL RENDER
    ===================================================== */

    renderSlots();

    setTimeout(() => {

        document.querySelectorAll(".reveal")
            .forEach(element => {

                const rect =
                    element.getBoundingClientRect();

                if (rect.top < window.innerHeight) {
                    element.classList.add("visible");
                }
            });

    }, 100);


    /* =====================================================
       INITIAL MESSAGE
    ===================================================== */

    setTimeout(() => {

        showToast(
            "ParkEase Online",
            "Live parking simulation is ready."
        );

    }, 1200);

});