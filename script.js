(function () {
    const html = document.documentElement;
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');
    const sunIconMobile = document.getElementById('sun-icon-mobile');
    const moonIconMobile = document.getElementById('moon-icon-mobile');
    const themeToggle = document.getElementById('theme-toggle');
    const themeToggleMobile = document.getElementById('theme-toggle-mobile');

    const germanStrings = window.FHV_I18N_DE || {};
    const defaultI18nContent = new WeakMap();

    const normalizeLang = (code) => {
        if (!code || typeof code !== 'string') return 'en';
        const c = code.trim().toLowerCase();
        return c.startsWith('de') ? 'de' : 'en';
    };

    const snapshotI18nDefaults = () => {
        document.querySelectorAll('[data-i18n]').forEach((element) => {
            defaultI18nContent.set(element, element.innerHTML);
        });
        const titleElement = document.querySelector('title[data-i18n-title]');
        if (titleElement) {
            defaultI18nContent.set(titleElement, titleElement.textContent);
        }
    };

    const applyPageLanguage = (languageCode) => {
        const lang = normalizeLang(languageCode);
        const eventFilterEl = document.getElementById('event-filter');
        const savedFilter = eventFilterEl ? eventFilterEl.value : null;

        document.querySelectorAll('[data-i18n]').forEach((element) => {
            const key = element.getAttribute('data-i18n');
            const fallback = defaultI18nContent.get(element);
            if (lang === 'de' && key && germanStrings[key]) {
                element.innerHTML = germanStrings[key];
            } else if (fallback !== undefined) {
                element.innerHTML = fallback;
            }
        });

        const titleElement = document.querySelector('title[data-i18n-title]');
        if (titleElement) {
            const key = titleElement.getAttribute('data-i18n-title');
            const fallbackTitle = defaultI18nContent.get(titleElement);
            if (lang === 'de' && key && germanStrings[key]) {
                titleElement.textContent = germanStrings[key];
            } else if (fallbackTitle !== undefined) {
                titleElement.textContent = fallbackTitle;
            }
        }

        if (eventFilterEl && savedFilter != null) {
            eventFilterEl.value = savedFilter;
        }
    };

    snapshotI18nDefaults();

    // Off-site (http/https) links open in a new tab. Same-page navigation (.html, #) stays in this tab.
    document.querySelectorAll('a[href]').forEach((a) => {
        const href = a.getAttribute('href') || '';
        if (!/^https?:\/\//i.test(href)) return;
        a.setAttribute('target', '_blank');
        const rel = a.getAttribute('rel') || '';
        if (!/\bnoopener\b/.test(rel)) {
            a.setAttribute('rel', (rel + ' noopener noreferrer').replace(/\s+/g, ' ').trim());
        }
    });

    const eventFilter = document.getElementById('event-filter');
    const eventListPanel = document.getElementById('event-list-panel');
    const eventCalendarPanel = document.getElementById('event-calendar-panel');
    const eventViewListBtn = document.getElementById('event-view-list');
    const eventViewCalendarBtn = document.getElementById('event-view-calendar');
    const eventCalPrev = document.getElementById('event-cal-prev');
    const eventCalNext = document.getElementById('event-cal-next');
    const eventCalMonthLabel = document.getElementById('event-cal-month-label');
    const eventCalDates = document.getElementById('event-cal-dates');
    const eventCalHoverCard = document.getElementById('event-cal-hover-card');

    if (eventFilter && eventListPanel && eventCalendarPanel && eventViewListBtn && eventViewCalendarBtn && eventCalDates && eventCalMonthLabel) {
        const eventRows = () => Array.from(document.querySelectorAll('#event-list .event-row[data-event-type][data-event-date]'));
        const toggleActiveClass = 'bg-white shadow-sm ring-1 ring-fhv-blue/40 dark:bg-gray-800 dark:ring-fhv-violet/40';
        let viewMode = 'list';
        let calendarMonth = new Date();

        const eventDateBounds = () => {
            const isos = eventRows().map((r) => r.getAttribute('data-event-date')).filter(Boolean).sort();
            if (!isos.length) {
                const n = new Date();
                const d = new Date(n.getFullYear(), n.getMonth(), 1);
                return { min: d, max: d };
            }
            const minD = new Date(isos[0] + 'T12:00:00');
            const maxD = new Date(isos[isos.length - 1] + 'T12:00:00');
            return {
                min: new Date(minD.getFullYear(), minD.getMonth(), 1),
                max: new Date(maxD.getFullYear(), maxD.getMonth(), 1),
            };
        };

        const clampCalendarMonth = (d) => {
            const { min, max } = eventDateBounds();
            if (d < min) return new Date(min);
            if (d > max) return new Date(max);
            return d;
        };

        const applyEventFilter = () => {
            const value = eventFilter.value;
            eventRows().forEach((row) => {
                const type = row.getAttribute('data-event-type');
                const show = value === 'all' || value === type;
                row.classList.toggle('hidden', !show);
            });
            if (viewMode === 'calendar') renderCalendar();
        };

        const eventsSnapshot = () =>
            eventRows()
                .filter((row) => !row.classList.contains('hidden'))
                .map((row) => {
                    const h3 = row.querySelector('h3');
                    const p = row.querySelector('p');
                    return {
                        dateIso: row.getAttribute('data-event-date'),
                        type: row.getAttribute('data-event-type'),
                        title: h3 ? h3.textContent.trim() : '',
                        meta: p ? p.textContent.trim() : '',
                    };
                });

        let hoverHideTimer = null;
        const hideHoverCard = () => {
            if (!eventCalHoverCard) return;
            eventCalHoverCard.classList.add('hidden');
            eventCalHoverCard.setAttribute('aria-hidden', 'true');
        };

        const showHoverCard = (cell, dayEvents) => {
            if (!eventCalHoverCard || !dayEvents.length) return;
            const metaBlocks = dayEvents.filter((ev) => ev.meta);
            if (!metaBlocks.length) return;
            if (hoverHideTimer) {
                clearTimeout(hoverHideTimer);
                hoverHideTimer = null;
            }
            eventCalHoverCard.replaceChildren();
            metaBlocks.forEach((ev) => {
                const wrap = document.createElement('div');
                wrap.className = `border-l-2 pl-1.5 mb-1.5 last:mb-0 ${ev.type === 'fhv' ? 'border-fhv-blue' : 'border-fhv-violet'}`;
                const metaEl = document.createElement('p');
                metaEl.className = 'text-xs text-gray-600 dark:text-gray-300';
                metaEl.textContent = ev.meta;
                wrap.appendChild(metaEl);
                eventCalHoverCard.appendChild(wrap);
            });
            const positionCard = () => {
                const r = cell.getBoundingClientRect();
                const cardW = eventCalHoverCard.offsetWidth || 220;
                const cardH = eventCalHoverCard.offsetHeight || 80;
                let left = r.left + r.width / 2 - cardW / 2;
                let top = r.bottom + 6;
                left = Math.max(8, Math.min(left, window.innerWidth - cardW - 8));
                if (top + cardH > window.innerHeight - 8) {
                    top = r.top - cardH - 6;
                }
                top = Math.max(8, top);
                eventCalHoverCard.style.left = `${left}px`;
                eventCalHoverCard.style.top = `${top}px`;
            };
            eventCalHoverCard.classList.remove('hidden');
            eventCalHoverCard.setAttribute('aria-hidden', 'false');
            requestAnimationFrame(positionCard);
        };

        const renderCalendar = () => {
            calendarMonth = clampCalendarMonth(calendarMonth);
            const lang = document.documentElement.lang || 'en';
            const locale = lang === 'de' ? 'de-AT' : 'en-GB';
            eventCalMonthLabel.textContent = calendarMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

            const y = calendarMonth.getFullYear();
            const m = calendarMonth.getMonth();
            const first = new Date(y, m, 1);
            const lastDay = new Date(y, m + 1, 0).getDate();
            const pad = (first.getDay() + 6) % 7;
            const events = eventsSnapshot();
            const byDay = {};
            events.forEach((ev) => {
                if (!ev.dateIso) return;
                if (!byDay[ev.dateIso]) byDay[ev.dateIso] = [];
                byDay[ev.dateIso].push(ev);
            });

            hideHoverCard();
            eventCalDates.innerHTML = '';
            for (let i = 0; i < pad; i++) {
                const el = document.createElement('div');
                el.className = 'min-h-[2.25rem]';
                eventCalDates.appendChild(el);
            }
            for (let day = 1; day <= lastDay; day++) {
                const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEvents = byDay[iso] || [];
                const hasFhv = dayEvents.some((e) => e.type === 'fhv');
                const hasOh = dayEvents.some((e) => e.type === 'oh');
                const cell = document.createElement('div');
                cell.className =
                    'event-cal-cell relative z-0 flex min-h-[3.55rem] flex-col items-stretch rounded-md px-0.5 py-0.5 tabular-nums';
                if (dayEvents.length) {
                    if (hasFhv && hasOh) {
                        cell.classList.add('bg-gradient-to-br', 'from-fhv-blue/25', 'to-fhv-violet/20', 'text-fhv-dark', 'dark:text-gray-100');
                    } else if (hasFhv) {
                        cell.classList.add('bg-fhv-blue/25', 'text-fhv-dark', 'dark:text-gray-100');
                    } else {
                        cell.classList.add('bg-fhv-violet/25', 'text-fhv-dark', 'dark:text-gray-100');
                    }
                } else {
                    cell.classList.add('bg-white/70', 'text-gray-700', 'dark:bg-gray-800/50', 'dark:text-gray-300');
                }

                const numRow = document.createElement('div');
                numRow.className = 'flex w-full shrink-0 justify-end';
                const num = document.createElement('span');
                num.className = 'font-semibold tabular-nums text-[10px] sm:text-xs';
                num.textContent = String(day);
                numRow.appendChild(num);
                cell.appendChild(numRow);

                if (dayEvents.length) {
                    const titlesWrap = document.createElement('div');
                    titlesWrap.className = 'mt-0.5 flex min-h-0 w-full min-w-0 flex-col gap-0.5';
                    dayEvents.forEach((ev) => {
                        if (!ev.title) return;
                        const row = document.createElement('div');
                        row.className = 'flex min-w-0 items-start gap-0.5';
                        const marker = document.createElement('span');
                        marker.setAttribute('aria-hidden', 'true');
                        marker.className =
                            'mt-0.5 h-1 w-1 shrink-0 rounded-full ' + (ev.type === 'fhv' ? 'bg-fhv-blue' : 'bg-fhv-violet');
                        const titleEl = document.createElement('span');
                        titleEl.className =
                            'min-w-0 flex-1 line-clamp-2 text-left text-[8px] font-medium leading-tight text-fhv-dark dark:text-gray-100 sm:text-[9px]';
                        titleEl.textContent = ev.title;
                        row.appendChild(marker);
                        row.appendChild(titleEl);
                        titlesWrap.appendChild(row);
                    });
                    cell.appendChild(titlesWrap);

                    if (dayEvents.some((e) => e.meta)) {
                        cell.addEventListener('mouseenter', () => showHoverCard(cell, dayEvents));
                        cell.addEventListener('mouseleave', () => {
                            hoverHideTimer = window.setTimeout(hideHoverCard, 120);
                        });
                    }
                }
                eventCalDates.appendChild(cell);
            }

            const { min, max } = eventDateBounds();
            const atMin = calendarMonth.getTime() <= min.getTime();
            const atMax = calendarMonth.getTime() >= max.getTime();
            if (eventCalPrev) {
                eventCalPrev.disabled = atMin;
                eventCalPrev.classList.toggle('opacity-40', atMin);
                eventCalPrev.classList.toggle('cursor-not-allowed', atMin);
            }
            if (eventCalNext) {
                eventCalNext.disabled = atMax;
                eventCalNext.classList.toggle('opacity-40', atMax);
                eventCalNext.classList.toggle('cursor-not-allowed', atMax);
            }
        };

        const setViewMode = (mode) => {
            const wasList = viewMode === 'list';
            viewMode = mode;
            const isList = mode === 'list';
            hideHoverCard();
            eventListPanel.classList.toggle('hidden', !isList);
            eventCalendarPanel.classList.toggle('hidden', isList);
            eventViewListBtn.setAttribute('aria-pressed', isList ? 'true' : 'false');
            eventViewCalendarBtn.setAttribute('aria-pressed', isList ? 'false' : 'true');
            toggleActiveClass.split(' ').map((className) => {
                eventViewListBtn.classList.toggle(className, isList);
                eventViewCalendarBtn.classList.toggle(className, !isList);    
            });
            if (!isList) {
                if (wasList) {
                    const now = new Date();
                    calendarMonth = clampCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                }
                renderCalendar();
            }
        };

        eventViewListBtn.addEventListener('click', () => setViewMode('list'));
        eventViewCalendarBtn.addEventListener('click', () => setViewMode('calendar'));

        if (eventCalPrev) {
            eventCalPrev.addEventListener('click', () => {
                if (eventCalPrev.disabled) return;
                calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
                renderCalendar();
            });
        }
        if (eventCalNext) {
            eventCalNext.addEventListener('click', () => {
                if (eventCalNext.disabled) return;
                calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
                renderCalendar();
            });
        }

        eventFilter.addEventListener('change', applyEventFilter);
        applyEventFilter();
        setViewMode('list');

        eventCalDates.addEventListener('scroll', hideHoverCard);
        window.addEventListener('scroll', hideHoverCard, true);

        document.addEventListener('fhv:languagechanged', () => {
            if (viewMode === 'calendar') renderCalendar();
        });
    } else if (eventFilter) {
        const rows = document.querySelectorAll('#event-list .event-row[data-event-type]');
        const applyEventFilter = () => {
            const value = eventFilter.value;
            rows.forEach((row) => {
                const type = row.getAttribute('data-event-type');
                const show = value === 'all' || value === type;
                row.classList.toggle('hidden', !show);
            });
        };
        eventFilter.addEventListener('change', applyEventFilter);
        applyEventFilter();
    }

    const semesterSelect = document.getElementById('semester-select');
    if (semesterSelect) {
        const panels = document.querySelectorAll('[data-semester-panel]');
        const applySemesterPanel = () => {
            const value = semesterSelect.value;
            panels.forEach((panel) => {
                const id = panel.getAttribute('data-semester-panel');
                panel.classList.toggle('hidden', id !== value);
            });
        };
        semesterSelect.addEventListener('change', applySemesterPanel);
        applySemesterPanel();
    }

    const profileBtn = document.getElementById('profile-dropdown');
    const profileMenu = document.getElementById('profile-menu');
    const profileBtnMobile = document.getElementById('profile-dropdown-mobile');
    const profileMenuMobile = document.getElementById('profile-menu-mobile');
    const navToggle = document.getElementById('nav-menu-toggle');
    const mobileNavPanel = document.getElementById('mobile-nav-panel');
    const navBackdrop = document.getElementById('nav-backdrop');
    const navIconOpen = document.getElementById('nav-icon-open');
    const navIconClose = document.getElementById('nav-icon-close');

    const setMobileNavOpen = (open) => {
        if (!navToggle || !mobileNavPanel) return;
        mobileNavPanel.classList.toggle('hidden', !open);
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        navToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
        if (navIconOpen && navIconClose) {
            navIconOpen.classList.toggle('hidden', open);
            navIconClose.classList.toggle('hidden', !open);
        }
        if (navBackdrop) {
            navBackdrop.classList.toggle('hidden', !open);
            navBackdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
        }
        document.body.classList.toggle('overflow-hidden', open);
        if (!open && profileMenuMobile) {
            profileMenuMobile.classList.add('hidden');
        }
    };

    const syncThemeIcons = () => {
        const dark = html.classList.contains('dark');
        [sunIcon, sunIconMobile].filter(Boolean).forEach((el) => {
            el.classList.toggle('hidden', !dark);
        });
        [moonIcon, moonIconMobile].filter(Boolean).forEach((el) => {
            el.classList.toggle('hidden', dark);
        });
    };

    const applyStoredTheme = () => {
        html.classList.remove('light');
        const stored = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const useDark = stored === 'dark' || ((stored === null || stored === '') && prefersDark);
        html.classList.toggle('dark', useDark);
        document.documentElement.style.colorScheme = useDark ? 'dark' : 'light';
        syncThemeIcons();
    };

    applyStoredTheme();

    const applyThemeToggle = (closeMobileNav) => {
        html.classList.remove('light');
        const nextDark = !html.classList.contains('dark');
        html.classList.toggle('dark', nextDark);
        localStorage.setItem('theme', nextDark ? 'dark' : 'light');
        document.documentElement.style.colorScheme = nextDark ? 'dark' : 'light';
        syncThemeIcons();
        if (closeMobileNav) setMobileNavOpen(false);
    };

    if (themeToggle) {
        themeToggle.addEventListener('click', () => applyThemeToggle(true));
    }
    if (themeToggleMobile) {
        themeToggleMobile.addEventListener('click', () => applyThemeToggle(false));
    }

    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setMobileNavOpen(false);
            if (profileMenuMobile) profileMenuMobile.classList.add('hidden');
            profileMenu.classList.toggle('hidden');
        });
    }

    if (profileBtnMobile && profileMenuMobile) {
        profileBtnMobile.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenuMobile.classList.toggle('hidden');
        });
    }

    document.addEventListener('click', (e) => {
        const inDesktop = profileBtn && profileMenu &&
            (profileBtn.contains(e.target) || profileMenu.contains(e.target));
        const inMobile = profileBtnMobile && profileMenuMobile &&
            (profileBtnMobile.contains(e.target) || profileMenuMobile.contains(e.target));
        if (!inDesktop && profileMenu) profileMenu.classList.add('hidden');
        if (!inMobile && profileMenuMobile) profileMenuMobile.classList.add('hidden');
    });

    if (navToggle && mobileNavPanel) {
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = mobileNavPanel.classList.contains('hidden');
            setMobileNavOpen(open);
        });

        mobileNavPanel.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => setMobileNavOpen(false));
        });

        const mq = window.matchMedia('(min-width: 768px)');
        const closeNavIfDesktop = () => {
            if (mq.matches) setMobileNavOpen(false);
        };
        mq.addEventListener('change', closeNavIfDesktop);
        closeNavIfDesktop();

        document.addEventListener('click', (e) => {
            if (mobileNavPanel.classList.contains('hidden')) return;
            if (navToggle.contains(e.target) || mobileNavPanel.contains(e.target)) return;
            setMobileNavOpen(false);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') setMobileNavOpen(false);
        });
    }

    if (navBackdrop) {
        navBackdrop.addEventListener('click', () => setMobileNavOpen(false));
    }

    const languageToggle = document.getElementById('language-toggle');
    const languageToggleMobile = document.getElementById('language-toggle-mobile');

    const syncLanguageToggle = (languageCode) => {
        const lang = normalizeLang(languageCode);
        document.querySelectorAll('.language-text-en').forEach((el) => {
            el.classList.toggle('hidden', lang !== 'en');
        });
        document.querySelectorAll('.language-text-de').forEach((el) => {
            el.classList.toggle('hidden', lang !== 'de');
        });
        const ariaEn = 'Language: English. Click to switch to German.';
        const ariaDe = germanStrings['profile.languageToggleAriaDe'] || 'Language: German. Click to switch to English.';
        document.querySelectorAll('.language-toggle').forEach((btn) => {
            btn.setAttribute('aria-label', lang === 'en' ? ariaEn : ariaDe);
        });
    };

    if (languageToggle || languageToggleMobile) {
        const setActiveLanguage = (languageCode) => {
            const lang = normalizeLang(languageCode);
            document.documentElement.lang = lang;
            localStorage.setItem('language', lang);
            applyPageLanguage(lang);
            syncLanguageToggle(lang);
            window.dispatchEvent(new CustomEvent('fhv:languagechanged'));
        };

        const storedLanguage = localStorage.getItem('language');
        const initialLanguage = normalizeLang(storedLanguage || document.documentElement.lang || 'en');
        setActiveLanguage(initialLanguage);

        const cycleLanguage = () => {
            const current = normalizeLang(document.documentElement.lang);
            const next = current === 'de' ? 'en' : 'de';
            setActiveLanguage(next);
        };

        if (languageToggle) {
            languageToggle.addEventListener('click', () => cycleLanguage());
        }
        if (languageToggleMobile) {
            languageToggleMobile.addEventListener('click', () => cycleLanguage());
        }
    }
})();
