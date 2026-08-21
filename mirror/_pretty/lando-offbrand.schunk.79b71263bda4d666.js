"use strict";
(self.webpackChunk = self.webpackChunk || []).push([
    ["985"], {
        487: function() {
            window.tram = function(t) {
                function e(t, e) {
                    return (new F.Bare).init(t, e)
                }

                function n(t) {
                    var e = parseInt(t.slice(1), 16);
                    return [e >> 16 & 255, e >> 8 & 255, 255 & e]
                }

                function i(t, e, n) {
                    return "#" + (0x1000000 | t << 16 | e << 8 | n).toString(16).slice(1)
                }

                function r() {}

                function o(t, e, n) {
                    if (void 0 !== e && (n = e), void 0 === t) return n;
                    var i = n;
                    return Z.test(t) || !K.test(t) ? i = parseInt(t, 10) : K.test(t) && (i = 1e3 * parseFloat(t)), 0 > i && (i = 0), i == i ? i : n
                }

                function a(t) {
                    B.debug && window && window.console.warn(t)
                }
                var s, u, c, l = function(t, e, n) {
                        function i(t) {
                            return "object" == typeof t
                        }

                        function r(t) {
                            return "function" == typeof t
                        }

                        function o() {}
                        return function a(s, u) {
                            function c() {
                                var t = new l;
                                return r(t.init) && t.init.apply(t, arguments), t
                            }

                            function l() {}
                            u === n && (u = s, s = Object), c.Bare = l;
                            var h, d = o[t] = s[t],
                                f = l[t] = c[t] = new o;
                            return f.constructor = c, c.mixin = function(e) {
                                return l[t] = c[t] = a(c, e)[t], c
                            }, c.open = function(t) {
                                if (h = {}, r(t) ? h = t.call(c, f, d, c, s) : i(t) && (h = t), i(h))
                                    for (var n in h) e.call(h, n) && (f[n] = h[n]);
                                return r(f.init) || (f.init = s), c
                            }, c.open(u)
                        }
                    }("prototype", {}.hasOwnProperty),
                    h = {
                        ease: ["ease", function(t, e, n, i) {
                            var r = (t /= i) * t,
                                o = r * t;
                            return e + n * (-2.75 * o * r + 11 * r * r + -15.5 * o + 8 * r + .25 * t)
                        }],
                        "ease-in": ["ease-in", function(t, e, n, i) {
                            var r = (t /= i) * t,
                                o = r * t;
                            return e + n * (-1 * o * r + 3 * r * r + -3 * o + 2 * r)
                        }],
                        "ease-out": ["ease-out", function(t, e, n, i) {
                            var r = (t /= i) * t,
                                o = r * t;
                            return e + n * (.3 * o * r + -1.6 * r * r + 2.2 * o + -1.8 * r + 1.9 * t)
                        }],
                        "ease-in-out": ["ease-in-out", function(t, e, n, i) {
                            var r = (t /= i) * t,
                                o = r * t;
                            return e + n * (2 * o * r + -5 * r * r + 2 * o + 2 * r)
                        }],
                        linear: ["linear", function(t, e, n, i) {
                            return n * t / i + e
                        }],
                        "ease-in-quad": ["cubic-bezier(0.550, 0.085, 0.680, 0.530)", function(t, e, n, i) {
                            return n * (t /= i) * t + e
                        }],
                        "ease-out-quad": ["cubic-bezier(0.250, 0.460, 0.450, 0.940)", function(t, e, n, i) {
                            return -n * (t /= i) * (t - 2) + e
                        }],
                        "ease-in-out-quad": ["cubic-bezier(0.455, 0.030, 0.515, 0.955)", function(t, e, n, i) {
                            return (t /= i / 2) < 1 ? n / 2 * t * t + e : -n / 2 * (--t * (t - 2) - 1) + e
                        }],
                        "ease-in-cubic": ["cubic-bezier(0.550, 0.055, 0.675, 0.190)", function(t, e, n, i) {
                            return n * (t /= i) * t * t + e
                        }],
                        "ease-out-cubic": ["cubic-bezier(0.215, 0.610, 0.355, 1)", function(t, e, n, i) {
                            return n * ((t = t / i - 1) * t * t + 1) + e
                        }],
                        "ease-in-out-cubic": ["cubic-bezier(0.645, 0.045, 0.355, 1)", function(t, e, n, i) {
                            return (t /= i / 2) < 1 ? n / 2 * t * t * t + e : n / 2 * ((t -= 2) * t * t + 2) + e
                        }],
                        "ease-in-quart": ["cubic-bezier(0.895, 0.030, 0.685, 0.220)", function(t, e, n, i) {
                            return n * (t /= i) * t * t * t + e
                        }],
                        "ease-out-quart": ["cubic-bezier(0.165, 0.840, 0.440, 1)", function(t, e, n, i) {
                            return -n * ((t = t / i - 1) * t * t * t - 1) + e
                        }],
                        "ease-in-out-quart": ["cubic-bezier(0.770, 0, 0.175, 1)", function(t, e, n, i) {
                            return (t /= i / 2) < 1 ? n / 2 * t * t * t * t + e : -n / 2 * ((t -= 2) * t * t * t - 2) + e
                        }],
                        "ease-in-quint": ["cubic-bezier(0.755, 0.050, 0.855, 0.060)", function(t, e, n, i) {
                            return n * (t /= i) * t * t * t * t + e
                        }],
                        "ease-out-quint": ["cubic-bezier(0.230, 1, 0.320, 1)", function(t, e, n, i) {
                            return n * ((t = t / i - 1) * t * t * t * t + 1) + e
                        }],
                        "ease-in-out-quint": ["cubic-bezier(0.860, 0, 0.070, 1)", function(t, e, n, i) {
                            return (t /= i / 2) < 1 ? n / 2 * t * t * t * t * t + e : n / 2 * ((t -= 2) * t * t * t * t + 2) + e
                        }],
                        "ease-in-sine": ["cubic-bezier(0.470, 0, 0.745, 0.715)", function(t, e, n, i) {
                            return -n * Math.cos(t / i * (Math.PI / 2)) + n + e
                        }],
                        "ease-out-sine": ["cubic-bezier(0.390, 0.575, 0.565, 1)", function(t, e, n, i) {
                            return n * Math.sin(t / i * (Math.PI / 2)) + e
                        }],
                        "ease-in-out-sine": ["cubic-bezier(0.445, 0.050, 0.550, 0.950)", function(t, e, n, i) {
                            return -n / 2 * (Math.cos(Math.PI * t / i) - 1) + e
                        }],
                        "ease-in-expo": ["cubic-bezier(0.950, 0.050, 0.795, 0.035)", function(t, e, n, i) {
                            return 0 === t ? e : n * Math.pow(2, 10 * (t / i - 1)) + e
                        }],
                        "ease-out-expo": ["cubic-bezier(0.190, 1, 0.220, 1)", function(t, e, n, i) {
                            return t === i ? e + n : n * (-Math.pow(2, -10 * t / i) + 1) + e
                        }],
                        "ease-in-out-expo": ["cubic-bezier(1, 0, 0, 1)", function(t, e, n, i) {
                            return 0 === t ? e : t === i ? e + n : (t /= i / 2) < 1 ? n / 2 * Math.pow(2, 10 * (t - 1)) + e : n / 2 * (-Math.pow(2, -10 * --t) + 2) + e
                        }],
                        "ease-in-circ": ["cubic-bezier(0.600, 0.040, 0.980, 0.335)", function(t, e, n, i) {
                            return -n * (Math.sqrt(1 - (t /= i) * t) - 1) + e
                        }],
                        "ease-out-circ": ["cubic-bezier(0.075, 0.820, 0.165, 1)", function(t, e, n, i) {
                            return n * Math.sqrt(1 - (t = t / i - 1) * t) + e
                        }],
                        "ease-in-out-circ": ["cubic-bezier(0.785, 0.135, 0.150, 0.860)", function(t, e, n, i) {
                            return (t /= i / 2) < 1 ? -n / 2 * (Math.sqrt(1 - t * t) - 1) + e : n / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + e
                        }],
                        "ease-in-back": ["cubic-bezier(0.600, -0.280, 0.735, 0.045)", function(t, e, n, i, r) {
                            return void 0 === r && (r = 1.70158), n * (t /= i) * t * ((r + 1) * t - r) + e
                        }],
                        "ease-out-back": ["cubic-bezier(0.175, 0.885, 0.320, 1.275)", function(t, e, n, i, r) {
                            return void 0 === r && (r = 1.70158), n * ((t = t / i - 1) * t * ((r + 1) * t + r) + 1) + e
                        }],
                        "ease-in-out-back": ["cubic-bezier(0.680, -0.550, 0.265, 1.550)", function(t, e, n, i, r) {
                            return void 0 === r && (r = 1.70158), (t /= i / 2) < 1 ? n / 2 * t * t * (((r *= 1.525) + 1) * t - r) + e : n / 2 * ((t -= 2) * t * (((r *= 1.525) + 1) * t + r) + 2) + e
                        }]
                    },
                    d = {
                        "ease-in-back": "cubic-bezier(0.600, 0, 0.735, 0.045)",
                        "ease-out-back": "cubic-bezier(0.175, 0.885, 0.320, 1)",
                        "ease-in-out-back": "cubic-bezier(0.680, 0, 0.265, 1)"
                    },
                    f = window,
                    p = "bkwld-tram",
                    m = /[\-\.0-9]/g,
                    v = /[A-Z]/,
                    w = "number",
                    b = /^(rgb|#)/,
                    g = /(em|cm|mm|in|pt|pc|px)$/,
                    y = /(em|cm|mm|in|pt|pc|px|%)$/,
                    x = /(deg|rad|turn)$/,
                    k = "unitless",
                    E = /(all|none) 0s ease 0s/,
                    _ = /^(width|height)$/,
                    L = document.createElement("a"),
                    A = ["Webkit", "Moz", "O", "ms"],
                    $ = ["-webkit-", "-moz-", "-o-", "-ms-"],
                    z = function(t) {
                        if (t in L.style) return {
                            dom: t,
                            css: t
                        };
                        var e, n, i = "",
                            r = t.split("-");
                        for (e = 0; e < r.length; e++) i += r[e].charAt(0).toUpperCase() + r[e].slice(1);
                        for (e = 0; e < A.length; e++)
                            if ((n = A[e] + i) in L.style) return {
                                dom: n,
                                css: $[e] + t
                            }
                    },
                    T = e.support = {
                        bind: Function.prototype.bind,
                        transform: z("transform"),
                        transition: z("transition"),
                        backface: z("backface-visibility"),
                        timing: z("transition-timing-function")
                    };
                if (T.transition) {
                    var S = T.timing.dom;
                    if (L.style[S] = h["ease-in-back"][0], !L.style[S])
                        for (var q in d) h[q][0] = d[q]
                }
                var j = e.frame = (s = f.requestAnimationFrame || f.webkitRequestAnimationFrame || f.mozRequestAnimationFrame || f.oRequestAnimationFrame || f.msRequestAnimationFrame) && T.bind ? s.bind(f) : function(t) {
                        f.setTimeout(t, 16)
                    },
                    M = e.now = (c = (u = f.performance) && (u.now || u.webkitNow || u.msNow || u.mozNow)) && T.bind ? c.bind(u) : Date.now || function() {
                        return +new Date
                    },
                    C = l(function(e) {
                        function n(t, e) {
                            var n = function(t) {
                                    for (var e = -1, n = t ? t.length : 0, i = []; ++e < n;) {
                                        var r = t[e];
                                        r && i.push(r)
                                    }
                                    return i
                                }(("" + t).split(" ")),
                                i = n[0];
                            e = e || {};
                            var r = X[i];
                            if (!r) return a("Unsupported property: " + i);
                            if (!e.weak || !this.props[i]) {
                                var o = r[0],
                                    s = this.props[i];
                                return s || (s = this.props[i] = new o.Bare), s.init(this.$el, n, r, e), s
                            }
                        }

                        function i(t, e, i) {
                            if (t) {
                                var a = typeof t;
                                if (e || (this.timer && this.timer.destroy(), this.queue = [], this.active = !1), "number" == a && e) return this.timer = new P({
                                    duration: t,
                                    context: this,
                                    complete: r
                                }), void(this.active = !0);
                                if ("string" == a && e) {
                                    switch (t) {
                                        case "hide":
                                            u.call(this);
                                            break;
                                        case "stop":
                                            s.call(this);
                                            break;
                                        case "redraw":
                                            c.call(this);
                                            break;
                                        default:
                                            n.call(this, t, i && i[1])
                                    }
                                    return r.call(this)
                                }
                                if ("function" == a) return void t.call(this, this);
                                if ("object" == a) {
                                    var d = 0;
                                    h.call(this, t, function(t, e) {
                                        t.span > d && (d = t.span), t.stop(), t.animate(e)
                                    }, function(t) {
                                        "wait" in t && (d = o(t.wait, 0))
                                    }), l.call(this), d > 0 && (this.timer = new P({
                                        duration: d,
                                        context: this
                                    }), this.active = !0, e && (this.timer.complete = r));
                                    var f = this,
                                        p = !1,
                                        m = {};
                                    j(function() {
                                        h.call(f, t, function(t) {
                                            t.active && (p = !0, m[t.name] = t.nextStyle)
                                        }), p && f.$el.css(m)
                                    })
                                }
                            }
                        }

                        function r() {
                            if (this.timer && this.timer.destroy(), this.active = !1, this.queue.length) {
                                var t = this.queue.shift();
                                i.call(this, t.options, !0, t.args)
                            }
                        }

                        function s(t) {
                            var e;
                            this.timer && this.timer.destroy(), this.queue = [], this.active = !1, "string" == typeof t ? (e = {})[t] = 1 : e = "object" == typeof t && null != t ? t : this.props, h.call(this, e, d), l.call(this)
                        }

                        function u() {
                            s.call(this), this.el.style.display = "none"
                        }

                        function c() {
                            this.el.offsetHeight
                        }

                        function l() {
                            var t, e, n = [];
                            for (t in this.upstream && n.push(this.upstream), this.props)(e = this.props[t]).active && n.push(e.string);
                            n = n.join(","), this.style !== n && (this.style = n, this.el.style[T.transition.dom] = n)
                        }

                        function h(t, e, i) {
                            var r, o, a, s, u = e !== d,
                                c = {};
                            for (r in t) a = t[r], r in Y ? (c.transform || (c.transform = {}), c.transform[r] = a) : (v.test(r) && (r = r.replace(/[A-Z]/g, function(t) {
                                return "-" + t.toLowerCase()
                            })), r in X ? c[r] = a : (s || (s = {}), s[r] = a));
                            for (r in c) {
                                if (a = c[r], !(o = this.props[r])) {
                                    if (!u) continue;
                                    o = n.call(this, r)
                                }
                                e.call(this, o, a)
                            }
                            i && s && i.call(this, s)
                        }

                        function d(t) {
                            t.stop()
                        }

                        function f(t, e) {
                            t.set(e)
                        }

                        function m(t) {
                            this.$el.css(t)
                        }

                        function w(t, n) {
                            e[t] = function() {
                                return this.children ? b.call(this, n, arguments) : (this.el && n.apply(this, arguments), this)
                            }
                        }

                        function b(t, e) {
                            var n, i = this.children.length;
                            for (n = 0; i > n; n++) t.apply(this.children[n], e);
                            return this
                        }
                        e.init = function(e) {
                            if (this.$el = t(e), this.el = this.$el[0], this.props = {}, this.queue = [], this.style = "", this.active = !1, B.keepInherited && !B.fallback) {
                                var n = G(this.el, "transition");
                                n && !E.test(n) && (this.upstream = n)
                            }
                            T.backface && B.hideBackface && H(this.el, T.backface.css, "hidden")
                        }, w("add", n), w("start", i), w("wait", function(t) {
                            t = o(t, 0), this.active ? this.queue.push({
                                options: t
                            }) : (this.timer = new P({
                                duration: t,
                                context: this,
                                complete: r
                            }), this.active = !0)
                        }), w("then", function(t) {
                            return this.active ? (this.queue.push({
                                options: t,
                                args: arguments
                            }), void(this.timer.complete = r)) : a("No active transition timer. Use start() or wait() before then().")
                        }), w("next", r), w("stop", s), w("set", function(t) {
                            s.call(this, t), h.call(this, t, f, m)
                        }), w("show", function(t) {
                            "string" != typeof t && (t = "block"), this.el.style.display = t
                        }), w("hide", u), w("redraw", c), w("destroy", function() {
                            s.call(this), t.removeData(this.el, p), this.$el = this.el = null
                        })
                    }),
                    F = l(C, function(e) {
                        function n(e, n) {
                            var i = t.data(e, p) || t.data(e, p, new C.Bare);
                            return i.el || i.init(e), n ? i.start(n) : i
                        }
                        e.init = function(e, i) {
                            var r = t(e);
                            if (!r.length) return this;
                            if (1 === r.length) return n(r[0], i);
                            var o = [];
                            return r.each(function(t, e) {
                                o.push(n(e, i))
                            }), this.children = o, this
                        }
                    }),
                    I = l(function(t) {
                        function e() {
                            var t = this.get();
                            this.update("auto");
                            var e = this.get();
                            return this.update(t), e
                        }
                        t.init = function(t, e, n, i) {
                            this.$el = t, this.el = t[0];
                            var r, a, s, u = e[0];
                            n[2] && (u = n[2]), U[u] && (u = U[u]), this.name = u, this.type = n[1], this.duration = o(e[1], this.duration, 500), this.ease = (r = e[2], a = this.ease, s = "ease", void 0 !== a && (s = a), r in h ? r : s), this.delay = o(e[3], this.delay, 0), this.span = this.duration + this.delay, this.active = !1, this.nextStyle = null, this.auto = _.test(this.name), this.unit = i.unit || this.unit || B.defaultUnit, this.angle = i.angle || this.angle || B.defaultAngle, B.fallback || i.fallback ? this.animate = this.fallback : (this.animate = this.transition, this.string = this.name + " " + this.duration + "ms" + ("ease" != this.ease ? " " + h[this.ease][0] : "") + (this.delay ? " " + this.delay + "ms" : ""))
                        }, t.set = function(t) {
                            t = this.convert(t, this.type), this.update(t), this.redraw()
                        }, t.transition = function(t) {
                            this.active = !0, t = this.convert(t, this.type), this.auto && ("auto" == this.el.style[this.name] && (this.update(this.get()), this.redraw()), "auto" == t && (t = e.call(this))), this.nextStyle = t
                        }, t.fallback = function(t) {
                            var n = this.el.style[this.name] || this.convert(this.get(), this.type);
                            t = this.convert(t, this.type), this.auto && ("auto" == n && (n = this.convert(this.get(), this.type)), "auto" == t && (t = e.call(this))), this.tween = new D({
                                from: n,
                                to: t,
                                duration: this.duration,
                                delay: this.delay,
                                ease: this.ease,
                                update: this.update,
                                context: this
                            })
                        }, t.get = function() {
                            return G(this.el, this.name)
                        }, t.update = function(t) {
                            H(this.el, this.name, t)
                        }, t.stop = function() {
                            (this.active || this.nextStyle) && (this.active = !1, this.nextStyle = null, H(this.el, this.name, this.get()));
                            var t = this.tween;
                            t && t.context && t.destroy()
                        }, t.convert = function(t, e) {
                            if ("auto" == t && this.auto) return t;
                            var n, r, o = "number" == typeof t,
                                s = "string" == typeof t;
                            switch (e) {
                                case w:
                                    if (o) return t;
                                    if (s && "" === t.replace(m, "")) return +t;
                                    r = "number(unitless)";
                                    break;
                                case b:
                                    if (s) {
                                        if ("" === t && this.original) return this.original;
                                        if (e.test(t)) return "#" == t.charAt(0) && 7 == t.length ? t : ((n = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(t)) ? i(n[1], n[2], n[3]) : t).replace(/#(\w)(\w)(\w)$/, "#$1$1$2$2$3$3")
                                    }
                                    r = "hex or rgb string";
                                    break;
                                case g:
                                    if (o) return t + this.unit;
                                    if (s && e.test(t)) return t;
                                    r = "number(px) or string(unit)";
                                    break;
                                case y:
                                    if (o) return t + this.unit;
                                    if (s && e.test(t)) return t;
                                    r = "number(px) or string(unit or %)";
                                    break;
                                case x:
                                    if (o) return t + this.angle;
                                    if (s && e.test(t)) return t;
                                    r = "number(deg) or string(angle)";
                                    break;
                                case k:
                                    if (o || s && y.test(t)) return t;
                                    r = "number(unitless) or string(unit or %)"
                            }
                            return a("Type warning: Expected: [" + r + "] Got: [" + typeof t + "] " + t), t
                        }, t.redraw = function() {
                            this.el.offsetHeight
                        }
                    }),
                    O = l(I, function(t, e) {
                        t.init = function() {
                            e.init.apply(this, arguments), this.original || (this.original = this.convert(this.get(), b))
                        }
                    }),
                    R = l(I, function(t, e) {
                        t.init = function() {
                            e.init.apply(this, arguments), this.animate = this.fallback
                        }, t.get = function() {
                            return this.$el[this.name]()
                        }, t.update = function(t) {
                            this.$el[this.name](t)
                        }
                    }),
                    N = l(I, function(t, e) {
                        function n(t, e) {
                            var n, i, r, o, a;
                            for (n in t) r = (o = Y[n])[0], i = o[1] || n, a = this.convert(t[n], r), e.call(this, i, a, r)
                        }
                        t.init = function() {
                            e.init.apply(this, arguments), this.current || (this.current = {}, Y.perspective && B.perspective && (this.current.perspective = B.perspective, H(this.el, this.name, this.style(this.current)), this.redraw()))
                        }, t.set = function(t) {
                            n.call(this, t, function(t, e) {
                                this.current[t] = e
                            }), H(this.el, this.name, this.style(this.current)), this.redraw()
                        }, t.transition = function(t) {
                            var e = this.values(t);
                            this.tween = new W({
                                current: this.current,
                                values: e,
                                duration: this.duration,
                                delay: this.delay,
                                ease: this.ease
                            });
                            var n, i = {};
                            for (n in this.current) i[n] = n in e ? e[n] : this.current[n];
                            this.active = !0, this.nextStyle = this.style(i)
                        }, t.fallback = function(t) {
                            var e = this.values(t);
                            this.tween = new W({
                                current: this.current,
                                values: e,
                                duration: this.duration,
                                delay: this.delay,
                                ease: this.ease,
                                update: this.update,
                                context: this
                            })
                        }, t.update = function() {
                            H(this.el, this.name, this.style(this.current))
                        }, t.style = function(t) {
                            var e, n = "";
                            for (e in t) n += e + "(" + t[e] + ") ";
                            return n
                        }, t.values = function(t) {
                            var e, i = {};
                            return n.call(this, t, function(t, n, r) {
                                i[t] = n, void 0 === this.current[t] && (e = 0, ~t.indexOf("scale") && (e = 1), this.current[t] = this.convert(e, r))
                            }), i
                        }
                    }),
                    D = l(function(e) {
                        function o() {
                            var t, e, n, i = u.length;
                            if (i)
                                for (j(o), e = M(), t = i; t--;)(n = u[t]) && n.render(e)
                        }
                        var s = {
                            ease: h.ease[1],
                            from: 0,
                            to: 1
                        };
                        e.init = function(t) {
                            this.duration = t.duration || 0, this.delay = t.delay || 0;
                            var e = t.ease || s.ease;
                            h[e] && (e = h[e][1]), "function" != typeof e && (e = s.ease), this.ease = e, this.update = t.update || r, this.complete = t.complete || r, this.context = t.context || this, this.name = t.name;
                            var n = t.from,
                                i = t.to;
                            void 0 === n && (n = s.from), void 0 === i && (i = s.to), this.unit = t.unit || "", "number" == typeof n && "number" == typeof i ? (this.begin = n, this.change = i - n) : this.format(i, n), this.value = this.begin + this.unit, this.start = M(), !1 !== t.autoplay && this.play()
                        }, e.play = function() {
                            this.active || (this.start || (this.start = M()), this.active = !0, 1 === u.push(this) && j(o))
                        }, e.stop = function() {
                            var e, n;
                            this.active && (this.active = !1, (n = t.inArray(this, u)) >= 0 && (e = u.slice(n + 1), u.length = n, e.length && (u = u.concat(e))))
                        }, e.render = function(t) {
                            var e, n = t - this.start;
                            if (this.delay) {
                                if (n <= this.delay) return;
                                n -= this.delay
                            }
                            if (n < this.duration) {
                                var r, o, a = this.ease(n, 0, 1, this.duration);
                                return e = this.startRGB ? (r = this.startRGB, o = this.endRGB, i(r[0] + a * (o[0] - r[0]), r[1] + a * (o[1] - r[1]), r[2] + a * (o[2] - r[2]))) : Math.round((this.begin + a * this.change) * c) / c, this.value = e + this.unit, void this.update.call(this.context, this.value)
                            }
                            e = this.endHex || this.begin + this.change, this.value = e + this.unit, this.update.call(this.context, this.value), this.complete.call(this.context), this.destroy()
                        }, e.format = function(t, e) {
                            if (e += "", "#" == (t += "").charAt(0)) return this.startRGB = n(e), this.endRGB = n(t), this.endHex = t, this.begin = 0, void(this.change = 1);
                            if (!this.unit) {
                                var i = e.replace(m, "");
                                i !== t.replace(m, "") && a("Units do not match [tween]: " + e + ", " + t), this.unit = i
                            }
                            e = parseFloat(e), t = parseFloat(t), this.begin = this.value = e, this.change = t - e
                        }, e.destroy = function() {
                            this.stop(), this.context = null, this.ease = this.update = this.complete = r
                        };
                        var u = [],
                            c = 1e3
                    }),
                    P = l(D, function(t) {
                        t.init = function(t) {
                            this.duration = t.duration || 0, this.complete = t.complete || r, this.context = t.context, this.play()
                        }, t.render = function(t) {
                            t - this.start < this.duration || (this.complete.call(this.context), this.destroy())
                        }
                    }),
                    W = l(D, function(t, e) {
                        t.init = function(t) {
                            var e, n;
                            for (e in this.context = t.context, this.update = t.update, this.tweens = [], this.current = t.current, t.values) n = t.values[e], this.current[e] !== n && this.tweens.push(new D({
                                name: e,
                                from: this.current[e],
                                to: n,
                                duration: t.duration,
                                delay: t.delay,
                                ease: t.ease,
                                autoplay: !1
                            }));
                            this.play()
                        }, t.render = function(t) {
                            var e, n, i = this.tweens.length,
                                r = !1;
                            for (e = i; e--;)(n = this.tweens[e]).context && (n.render(t), this.current[n.name] = n.value, r = !0);
                            return r ? void(this.update && this.update.call(this.context)) : this.destroy()
                        }, t.destroy = function() {
                            if (e.destroy.call(this), this.tweens) {
                                var t;
                                for (t = this.tweens.length; t--;) this.tweens[t].destroy();
                                this.tweens = null, this.current = null
                            }
                        }
                    }),
                    B = e.config = {
                        debug: !1,
                        defaultUnit: "px",
                        defaultAngle: "deg",
                        keepInherited: !1,
                        hideBackface: !1,
                        perspective: "",
                        fallback: !T.transition,
                        agentTests: []
                    };
                e.fallback = function(t) {
                    if (!T.transition) return B.fallback = !0;
                    B.agentTests.push("(" + t + ")");
                    var e = RegExp(B.agentTests.join("|"), "i");
                    B.fallback = e.test(navigator.userAgent)
                }, e.fallback("6.0.[2-5] Safari"), e.tween = function(t) {
                    return new D(t)
                }, e.delay = function(t, e, n) {
                    return new P({
                        complete: e,
                        duration: t,
                        context: n
                    })
                }, t.fn.tram = function(t) {
                    return e.call(null, this, t)
                };
                var H = t.style,
                    G = t.css,
                    U = {
                        transform: T.transform && T.transform.css
                    },
                    X = {
                        color: [O, b],
                        background: [O, b, "background-color"],
                        "outline-color": [O, b],
                        "border-color": [O, b],
                        "border-top-color": [O, b],
                        "border-right-color": [O, b],
                        "border-bottom-color": [O, b],
                        "border-left-color": [O, b],
                        "border-width": [I, g],
                        "border-top-width": [I, g],
                        "border-right-width": [I, g],
                        "border-bottom-width": [I, g],
                        "border-left-width": [I, g],
                        "border-spacing": [I, g],
                        "letter-spacing": [I, g],
                        margin: [I, g],
                        "margin-top": [I, g],
                        "margin-right": [I, g],
                        "margin-bottom": [I, g],
                        "margin-left": [I, g],
                        padding: [I, g],
                        "padding-top": [I, g],
                        "padding-right": [I, g],
                        "padding-bottom": [I, g],
                        "padding-left": [I, g],
                        "outline-width": [I, g],
                        opacity: [I, w],
                        top: [I, y],
                        right: [I, y],
                        bottom: [I, y],
                        left: [I, y],
                        "font-size": [I, y],
                        "text-indent": [I, y],
                        "word-spacing": [I, y],
                        width: [I, y],
                        "min-width": [I, y],
                        "max-width": [I, y],
                        height: [I, y],
                        "min-height": [I, y],
                        "max-height": [I, y],
                        "line-height": [I, k],
                        "scroll-top": [R, w, "scrollTop"],
                        "scroll-left": [R, w, "scrollLeft"]
                    },
                    Y = {};
                T.transform && (X.transform = [N], Y = {
                    x: [y, "translateX"],
                    y: [y, "translateY"],
                    rotate: [x],
                    rotateX: [x],
                    rotateY: [x],
                    scale: [w],
                    scaleX: [w],
                    scaleY: [w],
                    skew: [x],
                    skewX: [x],
                    skewY: [x]
                }), T.transform && T.backface && (Y.z = [y, "translateZ"], Y.rotateZ = [x], Y.scaleZ = [w], Y.perspective = [g]);
                var Z = /ms/,
                    K = /s|\./;
                return t.tram = e
            }(window.jQuery)
        },
        756: function(t, e, n) {
            var i, r, o, a, s, u, c, l, h, d, f, p, m, v, w, b, g, y, x, k, E = window.$,
                _ = n(487) && E.tram;
            (i = {}).VERSION = "1.6.0-Webflow", r = {}, o = Array.prototype, a = Object.prototype, s = Function.prototype, o.push, u = o.slice, o.concat, a.toString, c = a.hasOwnProperty, l = o.forEach, h = o.map, o.reduce, o.reduceRight, d = o.filter, o.every, f = o.some, p = o.indexOf, o.lastIndexOf, m = Object.keys, s.bind, v = i.each = i.forEach = function(t, e, n) {
                if (null == t) return t;
                if (l && t.forEach === l) t.forEach(e, n);
                else if (t.length === +t.length) {
                    for (var o = 0, a = t.length; o < a; o++)
                        if (e.call(n, t[o], o, t) === r) return
                } else
                    for (var s = i.keys(t), o = 0, a = s.length; o < a; o++)
                        if (e.call(n, t[s[o]], s[o], t) === r) return;
                return t
            }, i.map = i.collect = function(t, e, n) {
                var i = [];
                return null == t ? i : h && t.map === h ? t.map(e, n) : (v(t, function(t, r, o) {
                    i.push(e.call(n, t, r, o))
                }), i)
            }, i.find = i.detect = function(t, e, n) {
                var i;
                return w(t, function(t, r, o) {
                    if (e.call(n, t, r, o)) return i = t, !0
                }), i
            }, i.filter = i.select = function(t, e, n) {
                var i = [];
                return null == t ? i : d && t.filter === d ? t.filter(e, n) : (v(t, function(t, r, o) {
                    e.call(n, t, r, o) && i.push(t)
                }), i)
            }, w = i.some = i.any = function(t, e, n) {
                e || (e = i.identity);
                var o = !1;
                return null == t ? o : f && t.some === f ? t.some(e, n) : (v(t, function(t, i, a) {
                    if (o || (o = e.call(n, t, i, a))) return r
                }), !!o)
            }, i.contains = i.include = function(t, e) {
                return null != t && (p && t.indexOf === p ? -1 != t.indexOf(e) : w(t, function(t) {
                    return t === e
                }))
            }, i.delay = function(t, e) {
                var n = u.call(arguments, 2);
                return setTimeout(function() {
                    return t.apply(null, n)
                }, e)
            }, i.defer = function(t) {
                return i.delay.apply(i, [t, 1].concat(u.call(arguments, 1)))
            }, i.throttle = function(t) {
                var e, n, i;
                return function() {
                    e || (e = !0, n = arguments, i = this, _.frame(function() {
                        e = !1, t.apply(i, n)
                    }))
                }
            }, i.debounce = function(t, e, n) {
                var r, o, a, s, u, c = function() {
                    var l = i.now() - s;
                    l < e ? r = setTimeout(c, e - l) : (r = null, n || (u = t.apply(a, o), a = o = null))
                };
                return function() {
                    a = this, o = arguments, s = i.now();
                    var l = n && !r;
                    return r || (r = setTimeout(c, e)), l && (u = t.apply(a, o), a = o = null), u
                }
            }, i.defaults = function(t) {
                if (!i.isObject(t)) return t;
                for (var e = 1, n = arguments.length; e < n; e++) {
                    var r = arguments[e];
                    for (var o in r) void 0 === t[o] && (t[o] = r[o])
                }
                return t
            }, i.keys = function(t) {
                if (!i.isObject(t)) return [];
                if (m) return m(t);
                var e = [];
                for (var n in t) i.has(t, n) && e.push(n);
                return e
            }, i.has = function(t, e) {
                return c.call(t, e)
            }, i.isObject = function(t) {
                return t === Object(t)
            }, i.now = Date.now || function() {
                return new Date().getTime()
            }, i.templateSettings = {
                evaluate: /<%([\s\S]+?)%>/g,
                interpolate: /<%=([\s\S]+?)%>/g,
                escape: /<%-([\s\S]+?)%>/g
            }, b = /(.)^/, g = {
                "'": "'",
                "\\": "\\",
                "\r": "r",
                "\n": "n",
                "\u2028": "u2028",
                "\u2029": "u2029"
            }, y = /\\|'|\r|\n|\u2028|\u2029/g, x = function(t) {
                return "\\" + g[t]
            }, k = /^\s*(\w|\$)+\s*$/, i.template = function(t, e, n) {
                !e && n && (e = n);
                var r, o = RegExp([((e = i.defaults({}, e, i.templateSettings)).escape || b).source, (e.interpolate || b).source, (e.evaluate || b).source].join("|") + "|$", "g"),
                    a = 0,
                    s = "__p+='";
                t.replace(o, function(e, n, i, r, o) {
                    return s += t.slice(a, o).replace(y, x), a = o + e.length, n ? s += "'+\n((__t=(" + n + "))==null?'':_.escape(__t))+\n'" : i ? s += "'+\n((__t=(" + i + "))==null?'':__t)+\n'" : r && (s += "';\n" + r + "\n__p+='"), e
                }), s += "';\n";
                var u = e.variable;
                if (u) {
                    if (!k.test(u)) throw Error("variable is not a bare identifier: " + u)
                } else s = "with(obj||{}){\n" + s + "}\n", u = "obj";
                s = "var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};\n" + s + "return __p;\n";
                try {
                    r = Function(e.variable || "obj", "_", s)
                } catch (t) {
                    throw t.source = s, t
                }
                var c = function(t) {
                    return r.call(this, t, i)
                };
                return c.source = "function(" + u + "){\n" + s + "}", c
            }, t.exports = i
        },
        461: function(t, e, n) {
            var i = n(949);
            i.define("brand", t.exports = function(t) {
                var e, n = {},
                    r = document,
                    o = t("html"),
                    a = t("body"),
                    s = window.location,
                    u = /PhantomJS/i.test(navigator.userAgent),
                    c = "fullscreenchange webkitfullscreenchange mozfullscreenchange msfullscreenchange";

                function l() {
                    var n = r.fullScreen || r.mozFullScreen || r.webkitIsFullScreen || r.msFullscreenElement || !!r.webkitFullscreenElement;
                    t(e).attr("style", n ? "display: none !important;" : "")
                }

                function h() {
                    var t = a.children(".w-webflow-badge"),
                        n = t.length && t.get(0) === e,
                        r = i.env("editor");
                    if (n) {
                        r && t.remove();
                        return
                    }
                    t.length && t.remove(), r || a.append(e)
                }
                return n.ready = function() {
                    var n, i, a, d = o.attr("data-wf-status"),
                        f = o.attr("data-wf-domain") || "";
                    /\.webflow\.io$/i.test(f) && s.hostname !== f && (d = !0), d && !u && (e = e || (n = t('<a class="w-webflow-badge"></a>').attr("href", "https://webflow.com?utm_campaign=brandjs"), i = t("<img>").attr("src", "https://d3e54v103j8qbb.cloudfront.net/img/webflow-badge-icon-d2.89e12c322e.svg").attr("alt", "").css({
                        marginRight: "4px",
                        width: "26px"
                    }), a = t("<img>").attr("src", "https://d3e54v103j8qbb.cloudfront.net/img/webflow-badge-text-d2.c82cec3b78.svg").attr("alt", "Made in Webflow"), n.append(i, a), n[0]), h(), setTimeout(h, 500), t(r).off(c, l).on(c, l))
                }, n
            })
        },
        322: function(t, e, n) {
            var i = n(949);
            i.define("edit", t.exports = function(t, e, n) {
                if (n = n || {}, (i.env("test") || i.env("frame")) && !n.fixture && ! function() {
                        try {
                            return !!(window.top.__Cypress__ || window.PLAYWRIGHT_TEST)
                        } catch (t) {
                            return !1
                        }
                    }()) return {
                    exit: 1
                };
                var r, o = t(window),
                    a = t(document.documentElement),
                    s = document.location,
                    u = "hashchange",
                    c = n.load || function() {
                        var e, n, i;
                        r = !0, window.WebflowEditor = !0, o.off(u, h), e = function(e) {
                            var n;
                            t.ajax({
                                url: f("https://editor-api.webflow.com/api/editor/view"),
                                data: {
                                    siteId: a.attr("data-wf-site")
                                },
                                xhrFields: {
                                    withCredentials: !0
                                },
                                dataType: "json",
                                crossDomain: !0,
                                success: (n = e, function(e) {
                                    var i, r, o;
                                    if (!e) return void console.error("Could not load editor data");
                                    e.thirdPartyCookiesSupported = n, r = (i = e.scriptPath).indexOf("//") >= 0 ? i : f("https://editor-api.webflow.com" + i), o = function() {
                                        window.WebflowEditor(e)
                                    }, t.ajax({
                                        type: "GET",
                                        url: r,
                                        dataType: "script",
                                        cache: !0
                                    }).then(o, d)
                                })
                            })
                        }, (n = window.document.createElement("iframe")).src = "https://webflow.com/site/third-party-cookie-check.html", n.style.display = "none", n.sandbox = "allow-scripts allow-same-origin", i = function(t) {
                            "WF_third_party_cookies_unsupported" === t.data ? (p(n, i), e(!1)) : "WF_third_party_cookies_supported" === t.data && (p(n, i), e(!0))
                        }, n.onerror = function() {
                            p(n, i), e(!1)
                        }, window.addEventListener("message", i, !1), window.document.body.appendChild(n)
                    },
                    l = !1;
                try {
                    l = localStorage && localStorage.getItem && localStorage.getItem("WebflowEditor")
                } catch (t) {}

                function h() {
                    !r && /\?edit/.test(s.hash) && c()
                }

                function d(t, e, n) {
                    throw console.error("Could not load editor script: " + e), n
                }

                function f(t) {
                    return t.replace(/([^:])\/\//g, "$1/")
                }

                function p(t, e) {
                    window.removeEventListener("message", e, !1), t.remove()
                }
                return /[?&](update)(?:[=&?]|$)/.test(s.search) || /\?update$/.test(s.href) ? function() {
                    var t = document.documentElement,
                        e = t.getAttribute("data-wf-site"),
                        n = t.getAttribute("data-wf-page"),
                        i = t.getAttribute("data-wf-item-slug"),
                        r = t.getAttribute("data-wf-collection"),
                        o = t.getAttribute("data-wf-domain");
                    if (e && n) {
                        var a = "pageId=" + n + "&mode=edit";
                        a += "&simulateRole=editor&utm_source=legacy_editor", i && r && o && (a += "&domain=" + encodeURIComponent(o) + "&itemSlug=" + encodeURIComponent(i) + "&collectionId=" + r), window.location.href = "https://webflow.com/external/designer/" + e + "?" + a
                    }
                }() : l ? c() : s.search ? (/[?&](edit)(?:[=&?]|$)/.test(s.search) || /\?edit$/.test(s.href)) && c() : o.on(u, h).triggerHandler(u), {}
            })
        },
        338: function(t, e, n) {
            n(949).define("focus-visible", t.exports = function() {
                return {
                    ready: function() {
                        if ("undefined" != typeof document) try {
                            document.querySelector(":focus-visible")
                        } catch (t) {
                            ! function(t) {
                                var e = !0,
                                    n = !1,
                                    i = null,
                                    r = {
                                        text: !0,
                                        search: !0,
                                        url: !0,
                                        tel: !0,
                                        email: !0,
                                        password: !0,
                                        number: !0,
                                        date: !0,
                                        month: !0,
                                        week: !0,
                                        time: !0,
                                        datetime: !0,
                                        "datetime-local": !0
                                    };

                                function o(t) {
                                    return !!t && t !== document && "HTML" !== t.nodeName && "BODY" !== t.nodeName && "classList" in t && "contains" in t.classList
                                }

                                function a(t) {
                                    t.getAttribute("data-wf-focus-visible") || t.setAttribute("data-wf-focus-visible", "true")
                                }

                                function s() {
                                    e = !1
                                }

                                function u() {
                                    document.addEventListener("mousemove", c), document.addEventListener("mousedown", c), document.addEventListener("mouseup", c), document.addEventListener("pointermove", c), document.addEventListener("pointerdown", c), document.addEventListener("pointerup", c), document.addEventListener("touchmove", c), document.addEventListener("touchstart", c), document.addEventListener("touchend", c)
                                }

                                function c(t) {
                                    t.target.nodeName && "html" === t.target.nodeName.toLowerCase() || (e = !1, document.removeEventListener("mousemove", c), document.removeEventListener("mousedown", c), document.removeEventListener("mouseup", c), document.removeEventListener("pointermove", c), document.removeEventListener("pointerdown", c), document.removeEventListener("pointerup", c), document.removeEventListener("touchmove", c), document.removeEventListener("touchstart", c), document.removeEventListener("touchend", c))
                                }
                                document.addEventListener("keydown", function(n) {
                                    n.metaKey || n.altKey || n.ctrlKey || (o(t.activeElement) && a(t.activeElement), e = !0)
                                }, !0), document.addEventListener("mousedown", s, !0), document.addEventListener("pointerdown", s, !0), document.addEventListener("touchstart", s, !0), document.addEventListener("visibilitychange", function() {
                                    "hidden" === document.visibilityState && (n && (e = !0), u())
                                }, !0), u(), t.addEventListener("focus", function(t) {
                                    if (o(t.target)) {
                                        var n, i, s;
                                        (e || (i = (n = t.target).type, "INPUT" === (s = n.tagName) && r[i] && !n.readOnly || "TEXTAREA" === s && !n.readOnly || n.isContentEditable || 0)) && a(t.target)
                                    }
                                }, !0), t.addEventListener("blur", function(t) {
                                    if (o(t.target) && t.target.hasAttribute("data-wf-focus-visible")) {
                                        var e;
                                        n = !0, window.clearTimeout(i), i = window.setTimeout(function() {
                                            n = !1
                                        }, 100), (e = t.target).getAttribute("data-wf-focus-visible") && e.removeAttribute("data-wf-focus-visible")
                                    }
                                }, !0)
                            }(document)
                        }
                    }
                }
            })
        },
        334: function(t, e, n) {
            var i = n(949);
            i.define("focus", t.exports = function() {
                var t = [],
                    e = !1;

                function n(n) {
                    e && (n.preventDefault(), n.stopPropagation(), n.stopImmediatePropagation(), t.unshift(n))
                }

                function r(n) {
                    var i, r;
                    r = (i = n.target).tagName, (/^a$/i.test(r) && null != i.href || /^(button|textarea)$/i.test(r) && !0 !== i.disabled || /^input$/i.test(r) && /^(button|reset|submit|radio|checkbox)$/i.test(i.type) && !i.disabled || !/^(button|input|textarea|select|a)$/i.test(r) && !Number.isNaN(Number.parseFloat(i.tabIndex)) || /^audio$/i.test(r) || /^video$/i.test(r) && !0 === i.controls) && (e = !0, setTimeout(() => {
                        for (e = !1, n.target.focus(); t.length > 0;) {
                            var i = t.pop();
                            i.target.dispatchEvent(new MouseEvent(i.type, i))
                        }
                    }, 0))
                }
                return {
                    ready: function() {
                        "undefined" != typeof document && document.body.hasAttribute("data-wf-focus-within") && i.env.safari && (document.addEventListener("mousedown", r, !0), document.addEventListener("mouseup", n, !0), document.addEventListener("click", n, !0))
                    }
                }
            })
        },
        949: function(t, e, n) {
            var i, r, o = {},
                a = {},
                s = [],
                u = window.Webflow || [],
                c = window.jQuery,
                l = c(window),
                h = c(document),
                d = c.isFunction,
                f = o._ = n(756),
                p = o.tram = n(487) && c.tram,
                m = !1,
                v = !1;

            function w(t) {
                o.env() && (d(t.design) && l.on("__wf_design", t.design), d(t.preview) && l.on("__wf_preview", t.preview)), d(t.destroy) && l.on("__wf_destroy", t.destroy), t.ready && d(t.ready) && function(t) {
                    if (m) return t.ready();
                    f.contains(s, t.ready) || s.push(t.ready)
                }(t)
            }

            function b(t) {
                var e;
                d(t.design) && l.off("__wf_design", t.design), d(t.preview) && l.off("__wf_preview", t.preview), d(t.destroy) && l.off("__wf_destroy", t.destroy), t.ready && d(t.ready) && (e = t, s = f.filter(s, function(t) {
                    return t !== e.ready
                }))
            }
            p.config.hideBackface = !1, p.config.keepInherited = !0, o.define = function(t, e, n) {
                a[t] && b(a[t]);
                var i = a[t] = e(c, f, n) || {};
                return w(i), i
            }, o.require = function(t) {
                return a[t]
            }, o.push = function(t) {
                if (m) {
                    d(t) && t();
                    return
                }
                u.push(t)
            }, o.env = function(t) {
                var e = window.__wf_design,
                    n = void 0 !== e;
                return t ? "design" === t ? n && e : "preview" === t ? n && !e : "slug" === t ? n && window.__wf_slug : "editor" === t ? window.WebflowEditor : "test" === t ? window.__wf_test : "frame" === t ? window !== window.top : void 0 : n
            };
            var g = navigator.userAgent.toLowerCase(),
                y = o.env.touch = "ontouchstart" in window || window.DocumentTouch && document instanceof window.DocumentTouch,
                x = o.env.chrome = /chrome/.test(g) && /Google/.test(navigator.vendor) && parseInt(g.match(/chrome\/(\d+)\./)[1], 10),
                k = o.env.ios = /(ipod|iphone|ipad)/.test(g);
            o.env.safari = /safari/.test(g) && !x && !k, y && h.on("touchstart mousedown", function(t) {
                i = t.target
            }), o.validClick = y ? function(t) {
                return t === i || c.contains(t, i)
            } : function() {
                return !0
            };
            var E = "resize.webflow orientationchange.webflow load.webflow",
                _ = "scroll.webflow " + E;

            function L(t, e) {
                var n = [],
                    i = {};
                return i.up = f.throttle(function(t) {
                    f.each(n, function(e) {
                        e(t)
                    })
                }), t && e && t.on(e, i.up), i.on = function(t) {
                    "function" == typeof t && (f.contains(n, t) || n.push(t))
                }, i.off = function(t) {
                    if (!arguments.length) {
                        n = [];
                        return
                    }
                    n = f.filter(n, function(e) {
                        return e !== t
                    })
                }, i
            }

            function A(t) {
                d(t) && t()
            }

            function $() {
                r && (r.reject(), l.off("load", r.resolve)), r = new c.Deferred, l.on("load", r.resolve)
            }
            o.resize = L(l, E), o.scroll = L(l, _), o.redraw = L(), o.location = function(t) {
                window.location = t
            }, o.env() && (o.location = function() {}), o.ready = function() {
                m = !0, v ? (v = !1, f.each(a, w)) : f.each(s, A), f.each(u, A), o.resize.up()
            }, o.load = function(t) {
                r.then(t)
            }, o.destroy = function(t) {
                t = t || {}, v = !0, l.triggerHandler("__wf_destroy"), null != t.domready && (m = t.domready), f.each(a, b), o.resize.off(), o.scroll.off(), o.redraw.off(), s = [], u = [], "pending" === r.state() && $()
            }, c(o.ready), $(), t.exports = window.Webflow = o
        },
        624: function(t, e, n) {
            var i = n(949);
            i.define("links", t.exports = function(t, e) {
                var n, r, o, a = {},
                    s = t(window),
                    u = i.env(),
                    c = window.location,
                    l = document.createElement("a"),
                    h = "w--current",
                    d = /index\.(html|php)$/,
                    f = /\/$/;

                function p() {
                    var t = s.scrollTop(),
                        n = s.height();
                    e.each(r, function(e) {
                        if (!e.link.attr("hreflang")) {
                            var i = e.link,
                                r = e.sec,
                                o = r.offset().top,
                                a = r.outerHeight(),
                                s = .5 * n,
                                u = r.is(":visible") && o + a - s >= t && o + s <= t + n;
                            e.active !== u && (e.active = u, m(i, h, u))
                        }
                    })
                }

                function m(t, e, n) {
                    var i = t.hasClass(e);
                    (!n || !i) && (n || i) && (n ? t.addClass(e) : t.removeClass(e))
                }
                return a.ready = a.design = a.preview = function() {
                    n = u && i.env("design"), o = i.env("slug") || c.pathname || "", i.scroll.off(p), r = [];
                    for (var e = document.links, a = 0; a < e.length; ++a) ! function(e) {
                        if (!e.getAttribute("hreflang")) {
                            var i = n && e.getAttribute("href-disabled") || e.getAttribute("href");
                            if (l.href = i, !(i.indexOf(":") >= 0)) {
                                var a = t(e);
                                if (l.hash.length > 1 && l.host + l.pathname === c.host + c.pathname) {
                                    if (!/^#[a-zA-Z0-9\-\_]+$/.test(l.hash)) return;
                                    var s = t(l.hash);
                                    s.length && r.push({
                                        link: a,
                                        sec: s,
                                        active: !1
                                    });
                                    return
                                }
                                "#" !== i && "" !== i && m(a, h, !u && l.href === c.href || i === o || d.test(i) && f.test(o))
                            }
                        }
                    }(e[a]);
                    r.length && (i.scroll.on(p), p())
                }, a
            })
        },
        286: function(t, e, n) {
            var i = n(949);
            i.define("scroll", t.exports = function(t) {
                var e = {
                        WF_CLICK_EMPTY: "click.wf-empty-link",
                        WF_CLICK_SCROLL: "click.wf-scroll"
                    },
                    n = window.location,
                    r = ! function() {
                        try {
                            return !!window.frameElement
                        } catch (t) {
                            return !0
                        }
                    }() ? window.history : null,
                    o = t(window),
                    a = t(document),
                    s = t(document.body),
                    u = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || function(t) {
                        window.setTimeout(t, 15)
                    },
                    c = i.env("editor") ? ".w-editor-body" : "body",
                    l = "header, " + c + " > .header, " + c + " > .w-nav:not([data-no-scroll])",
                    h = 'a[href="#"]',
                    d = 'a[href*="#"]:not(.w-tab-link):not(' + h + ")",
                    f = document.createElement("style");
                f.appendChild(document.createTextNode('.wf-force-outline-none[tabindex="-1"]:focus{outline:none;}'));
                var p = /^#[a-zA-Z0-9][\w:.-]*$/;
                let m = "function" == typeof window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");

                function v(t, e) {
                    var n;
                    switch (e) {
                        case "add":
                            (n = t.attr("tabindex")) ? t.attr("data-wf-tabindex-swap", n): t.attr("tabindex", "-1");
                            break;
                        case "remove":
                            (n = t.attr("data-wf-tabindex-swap")) ? (t.attr("tabindex", n), t.removeAttr("data-wf-tabindex-swap")) : t.removeAttr("tabindex")
                    }
                    t.toggleClass("wf-force-outline-none", "add" === e)
                }

                function w(e) {
                    var a = e.currentTarget;
                    if (!(i.env("design") || window.$.mobile && /(?:^|\s)ui-link(?:$|\s)/.test(a.className))) {
                        var c = p.test(a.hash) && a.host + a.pathname === n.host + n.pathname ? a.hash : "";
                        if ("" !== c) {
                            var h, d = t(c);
                            d.length && (e && (e.preventDefault(), e.stopPropagation()), h = c, n.hash !== h && r && r.pushState && !(i.env.chrome && "file:" === n.protocol) && (r.state && r.state.hash) !== h && r.pushState({
                                hash: h
                            }, "", h), window.setTimeout(function() {
                                ! function(e, n) {
                                    var i = o.scrollTop(),
                                        r = function(e) {
                                            var n = t(l),
                                                i = "fixed" === n.css("position") ? n.outerHeight() : 0,
                                                r = e.offset().top - i;
                                            if ("mid" === e.data("scroll")) {
                                                var a = o.height() - i,
                                                    s = e.outerHeight();
                                                s < a && (r -= Math.round((a - s) / 2))
                                            }
                                            return r
                                        }(e);
                                    if (i !== r) {
                                        var a = function(t, e, n) {
                                                if ("none" === document.body.getAttribute("data-wf-scroll-motion") || m.matches) return 0;
                                                var i = 1;
                                                return s.add(t).each(function(t, e) {
                                                    var n = parseFloat(e.getAttribute("data-scroll-time"));
                                                    !isNaN(n) && n >= 0 && (i = n)
                                                }), (472.143 * Math.log(Math.abs(e - n) + 125) - 2e3) * i
                                            }(e, i, r),
                                            c = Date.now(),
                                            h = function() {
                                                var t, e, o, s, l, d = Date.now() - c;
                                                window.scroll(0, (t = i, e = r, (o = d) > (s = a) ? e : t + (e - t) * ((l = o / s) < .5 ? 4 * l * l * l : (l - 1) * (2 * l - 2) * (2 * l - 2) + 1))), d <= a ? u(h) : "function" == typeof n && n()
                                            };
                                        u(h)
                                    }
                                }(d, function() {
                                    v(d, "add"), d.get(0).focus({
                                        preventScroll: !0
                                    }), v(d, "remove")
                                })
                            }, 300 * !e))
                        }
                    }
                }
                return {
                    ready: function() {
                        var {
                            WF_CLICK_EMPTY: t,
                            WF_CLICK_SCROLL: n
                        } = e;
                        a.on(n, d, w), a.on(t, h, function(t) {
                            t.preventDefault()
                        }), document.head.insertBefore(f, document.head.firstChild)
                    }
                }
            })
        },
        695: function(t, e, n) {
            n(949).define("touch", t.exports = function(t) {
                var e = {},
                    n = window.getSelection;

                function i(e) {
                    var i, r, o = !1,
                        a = !1,
                        s = Math.min(Math.round(.04 * window.innerWidth), 40);

                    function u(t) {
                        var e = t.touches;
                        e && e.length > 1 || (o = !0, e ? (a = !0, i = e[0].clientX) : i = t.clientX, r = i)
                    }

                    function c(e) {
                        if (o) {
                            if (a && "mousemove" === e.type) {
                                e.preventDefault(), e.stopPropagation();
                                return
                            }
                            var i, u, c, l, d = e.touches,
                                f = d ? d[0].clientX : e.clientX,
                                p = f - r;
                            r = f, Math.abs(p) > s && n && "" === String(n()) && (i = "swipe", u = e, c = {
                                direction: p > 0 ? "right" : "left"
                            }, l = t.Event(i, {
                                originalEvent: u
                            }), t(u.target).trigger(l, c), h())
                        }
                    }

                    function l(t) {
                        if (o && (o = !1, a && "mouseup" === t.type)) {
                            t.preventDefault(), t.stopPropagation(), a = !1;
                            return
                        }
                    }

                    function h() {
                        o = !1
                    }
                    e.addEventListener("touchstart", u, !1), e.addEventListener("touchmove", c, !1), e.addEventListener("touchend", l, !1), e.addEventListener("touchcancel", h, !1), e.addEventListener("mousedown", u, !1), e.addEventListener("mousemove", c, !1), e.addEventListener("mouseup", l, !1), e.addEventListener("mouseout", h, !1), this.destroy = function() {
                        e.removeEventListener("touchstart", u, !1), e.removeEventListener("touchmove", c, !1), e.removeEventListener("touchend", l, !1), e.removeEventListener("touchcancel", h, !1), e.removeEventListener("mousedown", u, !1), e.removeEventListener("mousemove", c, !1), e.removeEventListener("mouseup", l, !1), e.removeEventListener("mouseout", h, !1), e = null
                    }
                }
                return t.event.special.tap = {
                    bindType: "click",
                    delegateType: "click"
                }, e.init = function(e) {
                    return (e = "string" == typeof e ? t(e).get(0) : e) ? new i(e) : null
                }, e.instance = e.init(document), e
            })
        }
    }
]);