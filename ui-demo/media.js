(() => {
    const tracks = [
        { id: "night-drive", title: "Night Drive", artist: "Mira Sol", album: "After Hours", duration: 212, genre: "ambient", art: "violet" },
        { id: "soft-focus", title: "Soft Focus", artist: "June Vale", album: "Blue Hour", duration: 198, genre: "ambient", art: "cyan" },
        { id: "open-windows", title: "Open Windows", artist: "Northbound", album: "Sunday Light", duration: 242, genre: "indie", art: "blue" },
        { id: "slow-motion", title: "Slow Motion", artist: "Mira Sol", album: "After Hours", duration: 176, genre: "ambient", art: "rose" },
        { id: "last-train", title: "Last Train Home", artist: "June Vale", album: "Blue Hour", duration: 227, genre: "indie", art: "orange" }
    ];

    const byId = new Map(tracks.map((track) => [track.id, track]));
    const state = {
        current: tracks[0],
        queue: tracks.slice(1).map((track) => track.id),
        history: [],
        position: 0,
        playing: false,
        filter: "all",
        view: "home"
    };

    const formatTime = (seconds) => {
        const safeSeconds = Math.max(0, Math.floor(seconds));
        return Math.floor(safeSeconds / 60) + ":" + String(safeSeconds % 60).padStart(2, "0");
    };

    const updateRangeProgress = (slider) => {
        const min = slider.min === "" ? 0 : Number(slider.min);
        const max = slider.max === "" ? 100 : Number(slider.max);
        const value = Number(slider.value);
        const progress = max > min ? Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)) : 0;
        slider.style.setProperty("--range-progress", progress + "%");
    };

    const updateArt = (element, track) => {
        Array.from(element.classList).forEach((className) => {
            if (className.startsWith("ui-album-art--")) element.classList.remove(className);
        });
        element.classList.add("ui-album-art--" + track.art);
        element.dataset.art = track.art;
    };

    const renderCards = () => {
        const container = document.querySelector("[data-track-cards]");
        if (!container) return;
        container.innerHTML = tracks.slice(0, 4).map((track) =>
            '<button class="ui-music-card" type="button" data-play-track="' + track.id + '">' +
            '<span class="ui-album-art ui-album-art--' + track.art + '" aria-hidden="true"></span>' +
            '<span class="ui-music-card-copy"><strong>' + track.title + '</strong><span>' + track.artist + '</span></span>' +
            '</button>'
        ).join("");
    };

    const renderTrackList = (selector, list, emptyText) => {
        const container = document.querySelector(selector);
        if (!container) return;
        if (list.length === 0) {
            container.innerHTML = '<p class="ui-empty-state">' + emptyText + '</p>';
            return;
        }
        container.innerHTML = list.map((track, index) =>
            '<button class="ui-track-row' + (track.id === state.current.id ? ' is-current' : '') + '" type="button" data-play-track="' + track.id + '">' +
            '<span class="ui-track-index">' + (index + 1) + '</span>' +
            '<span class="ui-album-art ui-album-art--' + track.art + ' ui-track-art" aria-hidden="true"></span>' +
            '<span class="ui-track-copy"><strong>' + track.title + '</strong><span>' + track.artist + ' · ' + track.album + '</span></span>' +
            '<span class="ui-track-genre">' + (track.genre === "ambient" ? "アンビエント" : "インディー") + '</span>' +
            '<time>' + formatTime(track.duration) + '</time>' +
            '</button>'
        ).join("");
    };

    const renderLists = () => {
        const query = (document.querySelector("#music-search")?.value || "").trim().toLocaleLowerCase();
        const results = tracks.filter((track) => [track.title, track.artist, track.album].join(" ").toLocaleLowerCase().includes(query));
        renderTrackList("[data-search-results]", results, "曲が見つかりませんでした。");
        const count = document.querySelector("[data-search-count]");
        if (count) count.textContent = results.length + " 曲";

        const libraryTracks = state.filter === "all" ? tracks : tracks.filter((track) => track.genre === state.filter);
        renderTrackList("[data-library-results]", libraryTracks, "この条件に合う曲はありません。");
        renderTrackList("[data-queue-results]", state.queue.map((id) => byId.get(id)).filter(Boolean), "再生キューは空です。");

        document.querySelectorAll("[data-queue-count]").forEach((element) => {
            element.textContent = String(state.queue.length);
        });

        document.querySelectorAll("[data-library-filter]").forEach((element) => {
            element.setAttribute("aria-pressed", String(element.dataset.libraryFilter === state.filter));
        });
    };

    const renderPlayer = () => {
        document.querySelectorAll("[data-current-title]").forEach((element) => {
            element.textContent = state.current.title;
        });
        document.querySelectorAll("[data-current-artist]").forEach((element) => {
            element.textContent = state.current.artist + " · " + state.current.album;
        });
        document.querySelectorAll("[data-track-duration]").forEach((element) => {
            element.textContent = formatTime(state.current.duration);
        });
        document.querySelectorAll("[data-current-art], [data-now-art]").forEach((element) => updateArt(element, state.current));
        document.querySelectorAll("[data-seek]").forEach((element) => {
            element.max = String(state.current.duration);
            element.value = String(state.position);
            updateRangeProgress(element);
        });
        document.querySelectorAll("[data-current-time]").forEach((element) => {
            element.textContent = formatTime(state.position);
        });
        document.querySelectorAll("[data-play-icon]").forEach((element) => {
            element.hidden = state.playing;
        });
        document.querySelectorAll("[data-pause-icon]").forEach((element) => {
            element.hidden = !state.playing;
        });
        document.querySelectorAll('[data-player-action="toggle"]').forEach((element) => {
            element.setAttribute("aria-label", state.playing ? "一時停止" : "再生");
            element.setAttribute("aria-pressed", String(state.playing));
        });
    };

    const render = () => {
        renderLists();
        renderPlayer();
    };

    const viewTitles = {
        home: "ホーム",
        search: "検索",
        library: "マイライブラリ",
        queue: "再生キュー",
        "now-playing": "再生中"
    };

    const setView = (view) => {
        if (!viewTitles[view]) return;
        const navView = view === "now-playing" ? state.view : view;
        state.view = view;
        document.querySelectorAll("[data-media-screen]").forEach((screen) => {
            screen.hidden = screen.dataset.mediaScreen !== view;
        });
        document.querySelectorAll("a[data-media-view]").forEach((link) => {
            if (link.dataset.mediaView === navView) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
        });
        const heading = document.querySelector("[data-media-heading]");
        if (heading) heading.textContent = viewTitles[view];
        window.history.replaceState(null, "", "#media-" + view);
        if (view === "search") document.querySelector("#music-search")?.focus({ preventScroll: true });
    };

    const playTrack = (id) => {
        const track = byId.get(id);
        if (!track) return;
        if (track.id !== state.current.id) {
            state.history.push(state.current.id);
            state.queue = state.queue.filter((queueId) => queueId !== track.id);
            state.queue.unshift(state.current.id);
        }
        state.current = track;
        state.position = 0;
        state.playing = true;
        render();
    };

    const nextTrack = () => {
        if (state.queue.length === 0) state.queue = tracks.filter((track) => track.id !== state.current.id).map((track) => track.id);
        const nextId = state.queue.shift();
        if (nextId) playTrack(nextId);
    };

    const previousTrack = () => {
        const previousId = state.history.pop();
        if (previousId) {
            state.queue = state.queue.filter((id) => id !== previousId);
            state.queue.unshift(state.current.id);
            state.current = byId.get(previousId);
            state.position = 0;
            state.playing = true;
            render();
        } else {
            state.position = 0;
            render();
        }
    };

    document.addEventListener("click", (event) => {
        const viewControl = event.target.closest("[data-media-view]");
        if (viewControl) {
            event.preventDefault();
            setView(viewControl.dataset.mediaView);
            return;
        }
        const trackControl = event.target.closest("[data-play-track]");
        if (trackControl) {
            playTrack(trackControl.dataset.playTrack);
            return;
        }
        const playerControl = event.target.closest("[data-player-action]");
        if (playerControl) {
            if (playerControl.dataset.playerAction === "toggle") {
                state.playing = !state.playing;
                render();
            } else if (playerControl.dataset.playerAction === "next") nextTrack();
            else previousTrack();
            return;
        }
        if (event.target.closest("[data-open-player]")) {
            setView("now-playing");
            return;
        }
        if (event.target.closest("[data-open-queue]")) setView("queue");
    });

    document.addEventListener("click", (event) => {
        const filterControl = event.target.closest("[data-library-filter]");
        if (!filterControl) return;
        state.filter = filterControl.dataset.libraryFilter;
        render();
    });

    document.querySelector("#music-search")?.addEventListener("input", renderLists);
    document.querySelectorAll('input[type="range"]').forEach((slider) => {
        updateRangeProgress(slider);
        slider.addEventListener("input", () => updateRangeProgress(slider));
    });
    document.querySelectorAll("[data-seek]").forEach((slider) => {
        slider.addEventListener("input", () => {
            state.position = Number(slider.value);
            renderPlayer();
        });
    });
    document.querySelector("[data-volume]")?.addEventListener("input", (event) => {
        event.currentTarget.setAttribute("aria-valuetext", event.currentTarget.value + "%");
    });

    window.setInterval(() => {
        if (!state.playing) return;
        state.position += 1;
        if (state.position >= state.current.duration) nextTrack();
        else renderPlayer();
    }, 1000);

    renderCards();
    render();
    const initialView = window.location.hash.replace("#media-", "");
    setView(viewTitles[initialView] ? initialView : "home");
})();
