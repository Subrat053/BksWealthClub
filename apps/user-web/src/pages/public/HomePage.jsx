
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowRight,
    Brain,
    Cpu,
    MessageCircle,
    ChevronRight,
    Plus,
    Facebook,
    Linkedin,
    Instagram,
} from "lucide-react";

const fadeLeft = {
    hidden: { opacity: 0, x: -70 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.9, ease: "easeOut" },
    },
};

const fadeRight = {
    hidden: { opacity: 0, x: 70 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.9, ease: "easeOut" },
    },
};

const fadeUp = {
    hidden: { opacity: 0, y: 60 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.9, ease: "easeOut" },
    },
};

const features = [
    {
        title: "Infinite Regeneration",
        desc: "Infinite security with regeneration to generate using automatic income.",
        icon: Cpu,
    },
    {
        title: "AI Driven",
        desc: "The coding of the program is structured in such a way that intelligence guides accuracy.",
        icon: Brain,
    },
    {
        title: "Decentralization",
        desc: "The transparency is visible in blockchain powered architecture.",
        icon: Cpu,
    },
    {
        title: "Vision",
        desc: "On minimum expenditures and trucking levels of limits, we reveal amazing growth systems.",
        icon: Brain,
    },
];

const faqs = [
    "What is Grow Con Joint",
    "What is the difference between other growth programs and bkswealthclub?",
    "How does it works ?",
    "Is auto pool safe for us ?",
    "How can I get started with Grow Con Joint ?",
];

export default function HomePage() {
    return (
        <div className="lg:space-y-0">
            <section className="relative min-h-screen overflow-hidden bg-[#021533] text-white">
                {/* background */}
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(1,16,44,0.96)_0%,rgba(2,25,61,0.96)_60%,rgba(8,63,96,0.88)_100%)]" />
                <div className="absolute inset-0 opacity-10 [background-image:linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:48px_48px]" />
                <div className="absolute bottom-0 right-0 h-[280px] w-[280px] bg-cyan-500/20 blur-3xl" />
                <div className="absolute left-[-80px] top-[140px] h-[220px] w-[220px] rounded-full bg-cyan-400/10 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-56 w-56 border-t-[120px] border-l-[120px] border-t-transparent border-l-cyan-600/40" />

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Navbar */}
                    {/* <header className="flex items-center justify-between py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/40 bg-white/10 text-xs font-bold text-cyan-300">
                GC
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide text-cyan-200">
                  BksWealthClub
                </p>
              </div>
            </div>

            <nav className="hidden items-center gap-8 text-sm text-slate-200 lg:flex">
              <a href="#home" className="transition hover:text-cyan-300">Home</a>
              <a href="#about" className="transition hover:text-cyan-300">About</a>
              <a href="#services" className="transition hover:text-cyan-300">Services</a>
              <a href="#projects" className="transition hover:text-cyan-300">Projects</a>
              <a href="#faq" className="transition hover:text-cyan-300">Faq</a>
              <a href="#contact" className="transition hover:text-cyan-300">Contact us</a>
            </nav>

            <div className="hidden items-center gap-3 sm:flex">
              <Link
                to="/login"
                className="group inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white ring-1 ring-white/15 backdrop-blur-md transition hover:bg-cyan-400 hover:text-slate-950"
              >
                Login
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-900 transition group-hover:bg-slate-900 group-hover:text-white">
                  <ChevronRight size={14} />
                </span>
              </Link>

              <Link
                to="/register"
                className="group inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-medium text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-105"
              >
                Register
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-900">
                  <ChevronRight size={14} />
                </span>
              </Link>
            </div>
          </header> */}

                    <div
                        id="home"
                        className="grid min-h-[calc(100vh-96px)] items-center gap-10 py-12 lg:grid-cols-2"
                    >
                        <motion.div
                            variants={fadeLeft}
                            initial="hidden"
                            animate="visible"
                            className="max-w-xl"
                        >
                            <h1 className="text-4xl font-extrabold uppercase leading-tight sm:text-5xl lg:text-6xl">
                                BksWealthClub
                            </h1>
                            <h2 className="mt-3 text-2xl font-bold leading-snug text-slate-100 sm:text-3xl">
                                Transmute Platform To Build Up With BksWealthClub.
                            </h2>
                            <p className="mt-6 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
                                This is a picture decentralized community building platform based on
                                smart contracts, connects people from across the world which will
                                create ample of wealth. This is a new economic financial system.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-4">
                                <Link
                                    to="/login"
                                    className="group inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-cyan-400 hover:text-slate-950"
                                >
                                    Login
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-900">
                                        <ArrowRight size={14} />
                                    </span>
                                </Link>

                                <Link
                                    to="/register"
                                    className="group inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-105"
                                >
                                    Register
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-900">
                                        <ArrowRight size={14} />
                                    </span>
                                </Link>
                            </div>
                        </motion.div>

                        <motion.div
                            variants={fadeRight}
                            initial="hidden"
                            animate="visible"
                            className="relative mx-auto flex items-center justify-center"
                        >
                            <div className="relative h-[360px] w-[360px] sm:h-[430px] sm:w-[430px]">
                                <div className="absolute inset-0 animate-[spin_18s_linear_infinite] rounded-full border-[18px] border-transparent border-t-cyan-400 border-r-lime-400 border-b-yellow-400 border-l-blue-500 opacity-90" />
                                <div className="absolute inset-[38px] rounded-full border border-white/10 bg-white/5 backdrop-blur-md" />
                                <div className="absolute left-1/2 top-0 h-10 w-10 -translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.7)]" />
                                <div className="absolute right-4 top-16 h-10 w-10 rounded-full bg-lime-400 shadow-[0_0_25px_rgba(163,230,53,0.7)]" />
                                <div className="absolute bottom-10 right-3 h-10 w-10 rounded-full bg-yellow-300 shadow-[0_0_25px_rgba(253,224,71,0.7)]" />
                                <div className="absolute bottom-2 left-1/2 h-10 w-10 -translate-x-1/2 rounded-full bg-red-400 shadow-[0_0_25px_rgba(248,113,113,0.7)]" />
                                <div className="absolute bottom-12 left-5 h-10 w-10 rounded-full bg-purple-400 shadow-[0_0_25px_rgba(192,132,252,0.7)]" />
                                <div className="absolute left-0 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-indigo-400 shadow-[0_0_25px_rgba(129,140,248,0.7)]" />
                                <div className="absolute left-10 top-20 h-10 w-10 rounded-full bg-sky-500 shadow-[0_0_25px_rgba(14,165,233,0.7)]" />
                                <div className="absolute inset-[100px] rounded-full border border-white/10 bg-[#08224d]/70 backdrop-blur-xl" />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ABOUT */}
            <section id="about" className="bg-white py-20">
                <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
                    <motion.div
                        variants={fadeLeft}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        className="mx-auto w-full max-w-[520px]"
                    >
                        <div className="overflow-hidden rounded-[28px] bg-slate-100 shadow-xl ring-1 ring-slate-200">
                            <img
                                src="/images/about-team.jpg"
                                alt="About BksWealthClub"
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src =
                                        "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1200&auto=format&fit=crop";
                                }}
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        variants={fadeRight}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                    >
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-500">
                            About Us
                        </p>
                        <h3 className="mt-3 max-w-xl text-4xl font-extrabold leading-tight text-slate-900">
                            Building the future of network marketing and digital automation
                        </h3>
                        <p className="mt-5 text-base leading-8 text-slate-600">
                            BksWealthClub is a smarter program connecting people together with
                            the help of AI. We are redefining the future of network marketing.
                            This is a community building platform using an automation pool, and
                            the history of network marketing is being revolutionized to the market.
                        </p>

                        <div className="mt-8 space-y-5">
                            <div className="flex gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 shadow-sm ring-1 ring-cyan-100">
                                    <MessageCircle size={26} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-slate-900">
                                        100% Assurance of Winning
                                    </h4>
                                    <p className="mt-1 text-slate-600">
                                        We build trust by delivering consistent gains from a protected time period.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 shadow-sm ring-1 ring-cyan-100">
                                    <Brain size={26} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-slate-900">
                                        Power of Compounding
                                    </h4>
                                    <p className="mt-1 text-slate-600">
                                        The first platform using many account multiplication strategy.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button className="group mt-8 inline-flex items-center gap-3 rounded-full bg-[#072144] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-cyan-500">
                            Read More
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-900">
                                <ArrowRight size={14} />
                            </span>
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* FEATURES */}
            <section id="services" className="bg-[#dff3f7] py-20">
                <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:px-8">
                    <motion.div
                        variants={fadeLeft}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        className="max-w-xl"
                    >
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-500">
                            Power of Compounding
                        </p>
                        <h3 className="mt-4 text-4xl font-extrabold leading-none text-slate-900 sm:text-6xl">
                            It is the first platform that we have been using the strategy of multiplying many accounts
                        </h3>
                        <p className="mt-6 text-base leading-8 text-slate-600">
                            The best crowd funding platform. Using AI based technology and the
                            advantages of crowd funding, it is an auto-pool plan which has
                            stopped somewhere, but the peculiar feature of GROW CON JOINT is
                            multiplication which makes it extraordinary from others.
                        </p>

                        <button className="group mt-8 inline-flex items-center gap-3 rounded-full bg-[#072144] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-cyan-500">
                            Read More
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-900">
                                <ArrowRight size={14} />
                            </span>
                        </button>
                    </motion.div>

                    <motion.div
                        variants={fadeRight}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        className="grid gap-6 sm:grid-cols-2"
                    >
                        {features.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={index}
                                    className="rounded-[26px] border border-cyan-100 bg-white p-7 shadow-[0_12px_35px_rgba(2,21,51,0.08)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_18px_45px_rgba(2,21,51,0.14)]"
                                >
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100">
                                        <Icon size={30} />
                                    </div>
                                    <h4 className="mt-5 text-xl font-bold text-slate-900">{item.title}</h4>
                                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.desc}</p>
                                    <button className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-500">
                                        Read More
                                    </button>
                                </div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            {/* REASON */}
            <section id="projects" className="relative overflow-hidden bg-[#021533] py-20 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(6,22,57,1)_0%,rgba(3,34,79,1)_55%,rgba(10,87,112,0.8)_100%)]" />
                <div className="absolute bottom-0 left-0 h-56 w-56 border-r-[140px] border-t-[140px] border-r-transparent border-t-cyan-600/35" />
                <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
                    <motion.div
                        variants={fadeLeft}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        className="mx-auto"
                    >
                        <div className="overflow-hidden rounded-[30px]">
                            <img
                                src="/images/reason-face.png"
                                alt="Reason to choose us"
                                className="w-full max-w-[500px] object-cover"
                                onError={(e) => {
                                    e.currentTarget.src =
                                        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1000&auto=format&fit=crop";
                                }}
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        variants={fadeRight}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        className="max-w-xl"
                    >
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
                            Reason To Choose Us
                        </p>
                        <h3 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
                            We Hope For Your Best Future
                        </h3>
                        <p className="mt-5 text-base leading-8 text-slate-300">
                            Earning together may build up impossible return by the power of
                            multiplication. It is all about the miracle of mathematics, which
                            astonishes everybody. Here is the chance to fulfill your and your dear ones dreams.
                        </p>

                        <div className="mt-8 space-y-4">
                            {[
                                "Algorithms for accurate structure",
                                "Power of compounding",
                                "24/7 Withdrawal",
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-slate-100">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-300 ring-1 ring-cyan-300/20">
                                        <ChevronRight size={14} />
                                    </span>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>

                        <button className="group mt-8 inline-flex items-center gap-3 rounded-full bg-[#081d3b] px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-cyan-500">
                            Read More
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-900">
                                <ArrowRight size={14} />
                            </span>
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* TESTIMONIAL */}
            <section className="bg-[#eaf8fb] py-20">
                <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                    >
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-500">
                            Testimonials
                        </p>
                        <h3 className="mt-3 text-4xl font-extrabold text-slate-900 sm:text-5xl">
                            Hear it From Our Clients
                        </h3>
                    </motion.div>

                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        className="mx-auto mt-12 max-w-4xl rounded-[30px] bg-white p-6 shadow-[0_18px_45px_rgba(2,21,51,0.08)] ring-1 ring-slate-100 sm:p-8"
                    >
                        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                            <img
                                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop"
                                alt="Client"
                                className="h-20 w-20 rounded-2xl object-cover"
                            />
                            <div className="flex-1 text-left">
                                <p className="text-lg italic leading-8 text-slate-700">
                                    “This would be proven the best one in future.”
                                </p>
                                <h4 className="mt-4 text-lg font-bold text-cyan-600">Michelle Lewis</h4>
                                <p className="text-sm text-slate-500">Long term investor</p>
                            </div>

                            <div className="flex gap-3 self-end sm:self-center">
                                <button className="flex h-11 w-11 items-center justify-center rounded-full bg-[#072144] text-white transition hover:bg-cyan-500">
                                    <ChevronRight size={16} />
                                </button>
                                <button className="flex h-11 w-11 items-center justify-center rounded-full bg-[#072144] text-white transition hover:bg-cyan-500">
                                    <ChevronRight size={16} className="rotate-180" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FAQ + CONTACT */}
            <section id="faq" className="bg-white py-20">
                <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
                    <motion.div
                        variants={fadeLeft}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                    >
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-500">
                            FAQs
                        </p>
                        <h3 className="mt-3 max-w-md text-4xl font-extrabold leading-none text-slate-900 sm:text-6xl">
                            Frequently Asked Questions
                        </h3>

                        <div className="mt-10 space-y-4">
                            {faqs.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between rounded-full border border-slate-200 bg-[#f8fbfd] px-5 py-4 shadow-sm transition hover:border-cyan-300"
                                >
                                    <span className="text-sm font-medium text-slate-700 sm:text-base">
                                        {item}
                                    </span>
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white">
                                        <Plus size={16} />
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        variants={fadeRight}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        id="contact"
                        className="relative"
                    >
                        <div className="absolute -right-2 -top-2 h-full w-full rounded-[30px] bg-cyan-400/40" />
                        <div className="relative rounded-[30px] bg-white p-8 shadow-[0_22px_55px_rgba(2,21,51,0.12)] ring-1 ring-slate-100">
                            <h4 className="text-3xl font-bold text-slate-900">Need any Help!</h4>
                            <p className="mt-2 text-slate-500">
                                Get in touch with Grow Con Joint — we are here to assist you.
                            </p>

                            <form className="mt-8 space-y-4">
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-cyan-400"
                                />
                                <input
                                    type="email"
                                    placeholder="Your Email"
                                    className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-cyan-400"
                                />
                                <input
                                    type="text"
                                    placeholder="Phone"
                                    className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-cyan-400"
                                />
                                <textarea
                                    rows="5"
                                    placeholder="Message"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
                                />

                                <button
                                    type="submit"
                                    className="group inline-flex items-center gap-3 rounded-full bg-[#072144] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-cyan-500"
                                >
                                    Submit Now
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-900">
                                        <ArrowRight size={14} />
                                    </span>
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}


