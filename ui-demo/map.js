(() => {
    const places = [
        { id: "north-coffee", name: "北口コーヒー", category: "CAFE · OPEN NOW", meta: "自家焙煎 · 08:00–19:00 · 徒歩3分", keywords: "coffee cafe コーヒー カフェ" },
        { id: "city-museum", name: "市立美術館", category: "MUSEUM · OPEN UNTIL 18:00", meta: "現代アート · 本日 18:00まで · 徒歩8分", keywords: "museum art 美術館 アート" },
        { id: "central-park", name: "中央公園", category: "PARK · OPEN 24 HOURS", meta: "芝生広場 · 入場無料 · 徒歩5分", keywords: "park green 公園" },
        { id: "station", name: "中央駅", category: "STATION · TOKYO METRO", meta: "各線乗り換え · 徒歩11分", keywords: "station train 駅 電車" }
    ];
    const routePaths = {
        "north-coffee": "M490 630 445 592 400 570",
        "city-museum": "M490 630 505 470 530 270",
        "central-park": "M490 630 340 480 180 170",
        station: "M490 630 452 740 440 860"
    };

    const app = document.querySelector(".ui-map-app");
    const viewport = document.querySelector("[data-map-viewport]");
    const world = document.querySelector("[data-map-world]");
    const search = document.querySelector("#map-search");
    const suggestions = document.querySelector("[data-map-suggestions]");
    const searchClear = document.querySelector("[data-map-clear]");
    const card = document.querySelector("[data-map-card]");
    const toast = document.querySelector("[data-map-toast]");
    const saved = new Set();
    let selected = places[0];
    let zoom = 1;
    let panX = 0;
    let panY = 0;
    let activePointer = null;
    let pointerStart = null;
    let toastTimer = 0;

    const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

    const applyTransform = () => {
        const worldWidth = window.innerWidth * zoom;
        const worldHeight = window.innerHeight * zoom;
        const limitX = Math.max(0, (worldWidth - window.innerWidth) / 2);
        const limitY = Math.max(0, (worldHeight - window.innerHeight) / 2);
        panX = clamp(panX, -limitX, limitX);
        panY = clamp(panY, -limitY, limitY);
        world.style.setProperty("--map-pan-x", panX + "px");
        world.style.setProperty("--map-pan-y", panY + "px");
        world.style.setProperty("--map-zoom", String(zoom));
    };

    const showToast = (message) => {
        toast.textContent = message;
        toast.hidden = false;
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => {
            toast.hidden = true;
        }, 2600);
    };

    const selectPlace = (place) => {
        if (!place) return;
        selected = place;
        document.querySelector("[data-map-title]").textContent = place.name;
        document.querySelector("[data-map-category]").textContent = place.category;
        document.querySelector("[data-map-meta]").textContent = place.meta;
        document.querySelector("[data-map-save]").setAttribute("aria-label", place.name + "を保存");
        document.querySelector("[data-map-save]").setAttribute("aria-pressed", String(saved.has(place.id)));
        document.querySelectorAll("[data-map-place]").forEach((marker) => {
            marker.dataset.selected = String(marker.dataset.mapPlace === place.id);
        });
        document.querySelectorAll("[data-map-route-path]").forEach((path) => {
            path.setAttribute("d", routePaths[place.id]);
        });
        card.classList.remove("is-collapsed");
        const expand = document.querySelector("[data-map-expand]");
        expand.setAttribute("aria-expanded", "true");
        expand.setAttribute("aria-label", "場所の詳細を折りたたむ");
        suggestions.hidden = true;
        window.history.replaceState(null, "", "#place/" + place.id);
    };

    const renderSuggestions = () => {
        const query = search.value.trim().toLocaleLowerCase();
        searchClear.hidden = query.length === 0;
        if (!query) {
            suggestions.hidden = true;
            suggestions.replaceChildren();
            return [];
        }
        const matches = places.filter((place) => (place.name + " " + place.keywords + " " + place.meta).toLocaleLowerCase().includes(query));
        suggestions.innerHTML = matches.length
            ? matches.map((place) =>
                '<button class="ui-map-suggestion" type="button" data-place-result="' + place.id + '">' +
                '<strong>' + place.name + '</strong><span>' + place.category + '</span></button>'
            ).join("")
            : '<p class="ui-empty-state">場所が見つかりません。</p>';
        suggestions.hidden = false;
        return matches;
    };

    const setZoom = (nextZoom) => {
        zoom = clamp(nextZoom, 0.85, 2.4);
        applyTransform();
    };

    document.querySelectorAll("[data-map-place]").forEach((marker) => {
        marker.addEventListener("click", () => {
            selectPlace(places.find((place) => place.id === marker.dataset.mapPlace));
        });
    });

    search.addEventListener("input", renderSuggestions);
    search.addEventListener("focus", () => {
        if (search.value.trim()) renderSuggestions();
    });
    search.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        const matches = renderSuggestions();
        if (matches[0]) selectPlace(matches[0]);
    });
    searchClear.addEventListener("click", () => {
        search.value = "";
        renderSuggestions();
        search.focus();
    });
    document.querySelector(".ui-map-search").addEventListener("submit", (event) => {
        event.preventDefault();
        const matches = renderSuggestions();
        if (matches[0]) selectPlace(matches[0]);
    });

    suggestions.addEventListener("click", (event) => {
        const result = event.target.closest("[data-place-result]");
        if (!result) return;
        selectPlace(places.find((place) => place.id === result.dataset.placeResult));
    });

    document.querySelector("[data-map-route]").addEventListener("click", (event) => {
        const active = app.classList.toggle("has-route");
        event.currentTarget.textContent = active ? "ルートを隠す" : "ルートを表示";
        showToast(active ? "徒歩ルート · 約8分" : "ルートを非表示にしました");
    });

    document.querySelector("[data-map-save]").addEventListener("click", (event) => {
        if (saved.has(selected.id)) saved.delete(selected.id);
        else saved.add(selected.id);
        const isSaved = saved.has(selected.id);
        event.currentTarget.setAttribute("aria-pressed", String(isSaved));
        showToast(isSaved ? "保存した場所に追加しました" : "保存した場所から削除しました");
    });

    document.querySelector("[data-map-share]").addEventListener("click", () => {
        showToast("共有リンク: #place/" + selected.id);
    });

    document.querySelector("[data-map-expand]").addEventListener("click", (event) => {
        const expanded = event.currentTarget.getAttribute("aria-expanded") !== "true";
        event.currentTarget.setAttribute("aria-expanded", String(expanded));
        event.currentTarget.setAttribute("aria-label", expanded ? "場所の詳細を折りたたむ" : "場所の詳細を展開する");
        card.classList.toggle("is-collapsed", !expanded);
    });

    document.querySelectorAll("[data-map-action]").forEach((button) => {
        button.addEventListener("click", () => {
            const action = button.dataset.mapAction;
            if (action === "zoom-in") setZoom(zoom + 0.25);
            if (action === "zoom-out") setZoom(zoom - 0.25);
            if (action === "layers") {
                const night = app.dataset.mapStyle !== "night";
                app.dataset.mapStyle = night ? "night" : "day";
                button.setAttribute("aria-pressed", String(night));
                showToast(night ? "夜間マップ" : "標準マップ");
            }
            if (action === "locate") {
                panX = 0;
                panY = 0;
                zoom = 1;
                applyTransform();
                document.querySelector("[data-user-location]").hidden = false;
                showToast("現在地付近を表示しています");
            }
        });
    });

    viewport.addEventListener("pointerdown", (event) => {
        if (event.target.closest("button, a, input, .ui-map-topbar, .ui-map-controls, .ui-map-place-card")) return;
        activePointer = event.pointerId;
        pointerStart = { x: event.clientX, y: event.clientY, panX, panY };
        viewport.setPointerCapture(event.pointerId);
        viewport.classList.add("is-dragging");
    });
    viewport.addEventListener("pointermove", (event) => {
        if (activePointer !== event.pointerId || !pointerStart) return;
        panX = pointerStart.panX + event.clientX - pointerStart.x;
        panY = pointerStart.panY + event.clientY - pointerStart.y;
        applyTransform();
    });
    const finishPan = (event) => {
        if (activePointer !== event.pointerId) return;
        activePointer = null;
        pointerStart = null;
        viewport.classList.remove("is-dragging");
    };
    viewport.addEventListener("pointerup", finishPan);
    viewport.addEventListener("pointercancel", finishPan);
    viewport.addEventListener("wheel", (event) => {
        event.preventDefault();
        setZoom(zoom + (event.deltaY < 0 ? 0.1 : -0.1));
    }, { passive: false });

    window.addEventListener("resize", applyTransform);
    applyTransform();
    const initialId = window.location.hash.startsWith("#place/") ? window.location.hash.slice(7) : "north-coffee";
    selectPlace(places.find((place) => place.id === initialId) || places[0]);
})();
