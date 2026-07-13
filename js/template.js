(function() {
        if (!window.gsap)
            throw new Error("gsap is not loaded — include gsap.min.js before this script.");

        const gsap = window.gsap;

        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)", ).matches;

        /**
         * @param {HTMLElement} panel
         * @param {HTMLElement | null} icon
         */
        function accordionOpen(panel, icon) {
            if (!panel)
                return;
            if (prefersReducedMotion) {
                panel.style.height = "auto";
                if (icon)
                    gsap.set(icon, {
                        rotation: 180
                    });
                return;
            }
            gsap.killTweensOf(panel);
            gsap.set(panel, {
                height: "auto"
            });
            const full = panel.offsetHeight;
            gsap.set(panel, {
                height: 0
            });
            gsap.to(panel, {
                height: full,
                duration: 0.38,
                ease: "power2.out",
                onComplete: () => {
                    gsap.set(panel, {
                        height: "auto"
                    });
                }
                ,
            });
            if (icon) {
                gsap.killTweensOf(icon);
                gsap.to(icon, {
                    rotation: 180,
                    duration: 0.2,
                    ease: "power2.out",
                });
            }
        }

        /**
         * @param {HTMLElement} panel
         * @param {HTMLElement | null} icon
         */
        function accordionClose(panel, icon) {
            if (!panel)
                return;
            if (prefersReducedMotion) {
                panel.style.height = "0px";
                if (icon)
                    gsap.set(icon, {
                        rotation: 0
                    });
                return;
            }
            gsap.killTweensOf(panel);
            const h = panel.scrollHeight;
            gsap.set(panel, {
                height: h
            });
            requestAnimationFrame( () => {
                    gsap.to(panel, {
                        height: 0,
                        duration: 0.32,
                        ease: "power2.in",
                    });
                }
            );
            if (icon) {
                gsap.killTweensOf(icon);
                gsap.to(icon, {
                    rotation: 0,
                    duration: 0.2,
                    ease: "power2.in",
                });
            }
        }

        /**
         * @param {{
         *   root: HTMLElement;
         *   panel: HTMLElement;
         *   staggerEls: HTMLElement[];
         * }} refs
         */
        function playOpen(refs) {
            const {root, panel, staggerEls} = refs;
            gsap.killTweensOf([root, panel, ...staggerEls]);

            root.classList.remove("pointer-events-none", "invisible");
            root.setAttribute("aria-hidden", "false");

            if (prefersReducedMotion) {
                gsap.set(root, {
                    opacity: 1
                });
                gsap.set(panel, {
                    xPercent: 0
                });
                gsap.set(staggerEls, {
                    opacity: 1,
                    x: 0
                });
                return;
            }

            const tl = gsap.timeline({
                defaults: {
                    ease: "power3.out"
                }
            });
            tl.fromTo(root, {
                opacity: 0
            }, {
                opacity: 1,
                duration: 0.22
            }, 0, ).fromTo(panel, {
                xPercent: 100
            }, {
                xPercent: 0,
                duration: 0.48
            }, 0, );

            if (staggerEls.length) {
                tl.fromTo(staggerEls, {
                    opacity: 0,
                    x: 18
                }, {
                    opacity: 1,
                    x: 0,
                    duration: 0.36,
                    stagger: 0.045,
                    ease: "power2.out",
                }, 0.1, );
            }
        }

        /**
         * @param {{
         *   root: HTMLElement;
         *   panel: HTMLElement;
         *   staggerEls: HTMLElement[];
         *   onComplete?: () => void;
         * }} refs
         */
        function playClose(refs) {
            const {root, panel, staggerEls, onComplete} = refs;
            gsap.killTweensOf([root, panel, ...staggerEls]);

            const done = () => {
                    root.classList.add("pointer-events-none", "invisible");
                    root.setAttribute("aria-hidden", "true");
                    onComplete?.();
                }
            ;

            if (prefersReducedMotion) {
                gsap.set(root, {
                    opacity: 0
                });
                gsap.set(panel, {
                    xPercent: 100
                });
                gsap.set(staggerEls, {
                    opacity: 0,
                    x: 18
                });
                done();
                return;
            }

            const tl = gsap.timeline({
                onComplete: done,
                defaults: {
                    ease: "power3.in"
                },
            });
            tl.to(staggerEls, {
                opacity: 0,
                x: 12,
                duration: 0.22,
                stagger: {
                    each: 0.02,
                    from: "end"
                },
                ease: "power2.in",
            }).to(panel, {
                xPercent: 100,
                duration: 0.42
            }, 0.06, ).to(root, {
                opacity: 0,
                duration: 0.2
            }, 0.32);
        }
        const root = document.querySelector(".js-mobile-nav");
        const panel = document.querySelector(".js-mobile-nav-panel");
        const backdrop = document.querySelector(".js-mobile-nav-backdrop");
        const openBtn = document.querySelector(".js-mobile-nav-open");
        const closeBtn = document.querySelector(".js-mobile-nav-close");
        const staggerRoot = document.querySelector(".js-mobile-nav-stagger");

        if (root && panel && backdrop && openBtn && closeBtn && staggerRoot) {
            const staggerEls = gsap.utils.toArray(staggerRoot.querySelectorAll(".js-mobile-nav-stagger-item"), );

            gsap.set(root, {
                opacity: 0
            });
            gsap.set(panel, {
                xPercent: 100
            });
            if (staggerEls.length) {
                gsap.set(staggerEls, {
                    opacity: 0,
                    x: 18
                });
            }

            let open = false;

            const setBodyScrollLock = (locked) => {
                    document.body.style.overflow = locked ? "hidden" : "";
                }
            ;

            const closeAllAccordions = () => {
                    root.querySelectorAll(".js-mobile-nav-accordion").forEach( (acc) => {
                            const trigger = acc.querySelector(".js-mobile-nav-accordion-trigger");
                            const p = acc.querySelector(".js-mobile-nav-accordion-panel");
                            const icon = acc.querySelector(".js-mobile-nav-accordion-icon");
                            if (trigger && p && trigger.getAttribute("aria-expanded") === "true") {
                                trigger.setAttribute("aria-expanded", "false");
                                accordionClose(p, icon);
                            }
                        }
                    );
                }
            ;

            const openMenu = () => {
                    if (open)
                        return;
                    open = true;
                    openBtn.setAttribute("aria-expanded", "true");
                    setBodyScrollLock(true);
                    closeAllAccordions();
                    playOpen({
                        root,
                        panel,
                        staggerEls
                    });
                    closeBtn.focus();
                }
            ;

            const closeMenu = () => {
                    if (!open)
                        return;
                    open = false;
                    openBtn.setAttribute("aria-expanded", "false");
                    playClose({
                        root,
                        panel,
                        staggerEls,
                        onComplete: () => setBodyScrollLock(false),
                    });
                    openBtn.focus();
                }
            ;

            openBtn.addEventListener("click", () => openMenu());

            backdrop.addEventListener("click", () => closeMenu());

            closeBtn.addEventListener("click", () => closeMenu());

            document.addEventListener("keydown", (e) => {
                    if (e.key === "Escape" && open) {
                        e.preventDefault();
                        closeMenu();
                    }
                }
            );

            root.querySelectorAll(".js-mobile-nav-accordion").forEach( (acc) => {
                    const trigger = acc.querySelector(".js-mobile-nav-accordion-trigger");
                    const p = acc.querySelector(".js-mobile-nav-accordion-panel");
                    const icon = acc.querySelector(".js-mobile-nav-accordion-icon");
                    if (!trigger || !p)
                        return;

                    trigger.addEventListener("click", () => {
                            const expanded = trigger.getAttribute("aria-expanded") === "true";
                            root.querySelectorAll(".js-mobile-nav-accordion").forEach( (other) => {
                                    if (other === acc)
                                        return;
                                    const t = other.querySelector(".js-mobile-nav-accordion-trigger");
                                    const panelEl = other.querySelector(".js-mobile-nav-accordion-panel");
                                    const ic = other.querySelector(".js-mobile-nav-accordion-icon");
                                    if (t && panelEl && t.getAttribute("aria-expanded") === "true") {
                                        t.setAttribute("aria-expanded", "false");
                                        accordionClose(panelEl, ic);
                                    }
                                }
                            );

                            if (expanded) {
                                trigger.setAttribute("aria-expanded", "false");
                                accordionClose(p, icon);
                            } else {
                                trigger.setAttribute("aria-expanded", "true");
                                accordionOpen(p, icon);
                            }
                        }
                    );
                }
            );

            root.querySelectorAll('a[href^="#"]').forEach( (link) => {
                    link.addEventListener("click", () => {
                            if (open)
                                closeMenu();
                        }
                    );
                }
            );
        }
    }
)();