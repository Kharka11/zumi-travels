/* ══════════════════════════════════════════
   ZUMI TRAVELS — Main Script
══════════════════════════════════════════ */

// ── Dzongkhag Data ───────────────────────
const DZONGKHAGS = {
  paro: {
    name: 'Paro', tag: 'Western Bhutan',
    tagline: "Tiger's Nest, terraced rice valleys & Bhutan's only international gateway",
    heroImg: '/images/paro-hero.jpg',
    history: "Paro is Bhutan's most visited valley, and for good reason. Home to the iconic Taktsang Monastery, known as Tiger's Nest, clinging to a sheer granite cliff at 3,120m, the valley is both a spiritual threshold and a practical gateway. The flat, terraced rice fields and traditional farmhouses below offer a quieter counterpoint to the sacred heights above.",
    gallery: [
      { img: '/images/paro-g1.jpg', caption: "Tiger's Nest Monastery" },
      { img: '/images/paro-g2.jpg', caption: 'Paro Valley' },
      { img: '/images/paro-g3.jpg', caption: 'Terraced Rice Fields' },
    ],
    moments: [
      { img: '/images/paro-m1.jpg', title: "Tiger's Nest Trek", desc: "Climb 900m through blue pine forest to the sacred monastery. Four hours up, half that down. Worth every step." },
      { img: '/images/paro-m2.jpg', title: 'Paro Rinpung Dzong', desc: "The fortress-monastery guards the valley entrance. Visit at dusk when monks return from evening prayer." },
      { img: '/images/paro-m3.jpg', title: 'Paddy Field Walks', desc: "In autumn, the rice turns gold. Walk the bunds between fields as farmers harvest by hand." },
    ]
  },
  thimphu: {
    name: 'Thimphu', tag: 'The Capital',
    tagline: "Buddha Dordenma, weekend market, and the pulse of modern Bhutan",
    heroImg: '/images/thimphu-hero.jpg',
    history: "Bhutan's capital and only city, Thimphu is where tradition meets the 21st century. Monks in crimson robes share the same lanes as young Bhutanese on smartphones. The towering Buddha Dordenma, 51 metres of gilded bronze, watches over the valley from the southern hills.",
    gallery: [
      { img: '/images/thimphu-g1.jpg', caption: 'Thimphu Valley' },
      { img: '/images/thimphu-g2.jpg', caption: 'Tashichho Dzong' },
      { img: '/images/thimphu-g3.jpg', caption: 'Weekend Farmers Market' },
    ],
    moments: [
      { img: '/images/thimphu-m1.jpg', title: 'Buddha Dordenma at Sunrise', desc: "Arrive before the pilgrims. The giant bronze figure catches the first light as mist rises from the valley below." },
      { img: '/images/thimphu-m2.jpg', title: "Weekend Farmers' Market", desc: "Every weekend, farmers from surrounding valleys bring produce, dried yak cheese, and homemade ara." },
      { img: '/images/thimphu-m3.jpg', title: 'Tashichho Dzong at Dusk', desc: "The government fortress glows gold at dusk. Walk the whitewashed corridors as the day cools." },
    ]
  },
  punakha: {
    name: 'Punakha', tag: 'Winter Capital',
    tagline: "The dzong at the confluence of two rivers, the longest suspension bridge in Bhutan",
    heroImg: '/images/punakha-hero.jpg',
    history: "Built in 1637 at the meeting of the Mo Chhu and Pho Chhu rivers, Punakha Dzong was Bhutan's capital for over 300 years and still hosts the winter seat of the Je Khenpo, the country's chief abbot. Wrapped in jacaranda blossom each spring, it remains one of the kingdom's most sacred and beautiful fortresses.",
    gallery: [
      { img: '/images/punakha-g1.jpg', caption: 'Punakha Dzong' },
      { img: '/images/punakha-g2.jpg', caption: 'Phobjikha Valley' },
      { img: '/images/punakha-g3.jpg', caption: 'The Valley in Bloom' },
    ],
    moments: [
      { img: '/images/punakha-m1.jpg', title: 'Sunrise in the Dzong Courtyard', desc: "Before the crowds arrive. Just monks, incense smoke, and the sound of two rivers meeting below." },
      { img: '/images/punakha-m2.jpg', title: 'Crossing the Suspension Bridge', desc: "Prayer flags overhead, the Mo Chhu 50m below. The longest suspension bridge in Bhutan." },
      { img: '/images/punakha-m3.jpg', title: 'Hot Stone Bath by the River', desc: "River-warmed stones and artemisia leaves. A traditional Bhutanese remedy, taken valley-side after a long day." },
    ]
  },
  bumthang: {
    name: 'Bumthang', tag: 'Spiritual Heartland',
    tagline: "Four alpine valleys, ancient temples, and a pace of life unchanged for a thousand years",
    heroImg: '/images/bumthang-hero.jpg',
    history: "The spiritual heartland of Bhutan, Bumthang is a cluster of four valleys at 2,600m. Home to some of the country's oldest temples, including Jambay Lhakhang, built in 659 AD, the region carries a deep, contemplative energy. Buckwheat fields, apple orchards and high yak pastures surround sites that have drawn pilgrims for over a thousand years.",
    gallery: [
      { img: '/images/bumthang-g1.jpg', caption: 'Bumthang Valley' },
      { img: '/images/bumthang-g2.jpg', caption: 'Tang Valley' },
      { img: '/images/bumthang-g3.jpg', caption: 'Mountain Retreat' },
    ],
    moments: [
      { img: '/images/bumthang-m1.jpg', title: 'Jambay Lhakhang at Dusk', desc: "One of the Himalaya's oldest temples, lit by butter lamps as evening falls. Monks conduct puja inside." },
      { img: '/images/bumthang-m2.jpg', title: 'Ura Valley Walk', desc: "The highest and most remote of the four Bumthang valleys. A day walk through buckwheat fields and stone villages." },
      { img: '/images/bumthang-m3.jpg', title: 'Red Rice Harvest', desc: "In autumn, Bumthang's fields turn deep russet. A slow, beautiful walk among farmers at work." },
    ]
  },
  haa: {
    name: 'Haa', tag: 'Far West',
    tagline: "Opened to visitors only in 2002. A remote valley for the truly curious traveller",
    heroImg: '/images/haa-hero.jpg',
    history: "Opened to tourists only in 2002, Haa remains one of Bhutan's most pristine and undiscovered valleys. Tucked away in the far west and bordering Tibet, Haa shelters ancient monastery ruins, unspoiled yak pastures, and a pace of life unchanged for centuries. Those who make the effort find a Bhutan more stripped back, and more itself.",
    gallery: [
      { img: '/images/haa-g1.jpg', caption: 'Haa Valley' },
      { img: '/images/haa-g2.jpg', caption: 'High Mountain Pass' },
      { img: '/images/haa-g3.jpg', caption: 'Yak Pastures' },
    ],
    moments: [
      { img: '/images/haa-m1.jpg', title: 'Kila Nunnery Trail', desc: "A steep climb to one of Bhutan's oldest nunneries, perched above the valley like a whisper against the cliff." },
      { img: '/images/haa-m2.jpg', title: 'Meeting the Yak Herders', desc: "In summer, the high pastures fill with yaks and the families who follow them. Tea by a nomad fire is offered freely." },
      { img: '/images/haa-m3.jpg', title: 'Chele La Pass at Dawn', desc: "At 3,988m, one of Bhutan's highest motorable passes. On clear days, Chomolhari (7,326m) fills the horizon." },
    ]
  }
};

// ── Experiences Data ─────────────────────
const EXPERIENCES = [
  { title: "Tiger's Nest Trek",       desc: "Four hours through blue pine forest to the sacred monastery at 3,120m. Transformative.",     img: '/images/exp-1.jpg' },
  { title: 'Punakha Dzong at Sunrise',desc: "The dzong at the river confluence, jacaranda in bloom. Before the world wakes up.",             img: '/images/exp-2.jpg' },
  { title: 'Hot Stone Bath',          desc: "River-warmed stones and artemisia. A traditional Bhutanese remedy, valley-side.",              img: '/images/exp-3.jpg' },
  { title: 'The Suspension Bridge',   desc: "Prayer flags overhead, the Mo Chhu 50m below. The longest suspension bridge in Bhutan.",      img: '/images/exp-4.jpg' },
  { title: 'Tshechu Festival',        desc: "Masked cham dances, ancient teachings, and a valley alive with colour and prayer.",            img: '/images/exp-5.jpg' },
  { title: 'Dochula Pass at Dawn',    desc: "108 chortens, prayer flags, and the full arc of the eastern Himalayas.",                       img: '/images/exp-6.jpg' },
];

// ── Render experiences ───────────────────
const expGrid = document.getElementById('expGrid');
EXPERIENCES.forEach(exp => {
  const card = document.createElement('div');
  card.className = 'exp-card reveal';
  card.innerHTML = `
    <div class="exp-img" style="background-image:url('${exp.img}')"></div>
    <div class="exp-overlay">
      <h4>${exp.title}</h4>
      <p>${exp.desc}</p>
    </div>`;
  expGrid.appendChild(card);
});

// ── WhatsApp float ───────────────────────
fetch('/api/config')
  .then(r => r.json())
  .then(cfg => {
    if (!cfg.whatsappNumber) return;
    const btn = document.getElementById('waFloat');
    btn.href = `https://wa.me/${cfg.whatsappNumber}?text=Hi%2C%20I%27m%20interested%20in%20planning%20a%20trip%20to%20Bhutan.`;
    btn.style.display = '';

    // Hide button when footer is in view so it doesn't overlap
    const footer = document.querySelector('.footer');
    if (footer) {
      new IntersectionObserver(([entry]) => {
        btn.style.opacity       = entry.isIntersecting ? '0' : '1';
        btn.style.pointerEvents = entry.isIntersecting ? 'none' : '';
      }, { threshold: 0.1 }).observe(footer);
    }
  })
  .catch(() => {});

// ── Nav scroll ───────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 80);
});

// Hero subtle pan effect
const heroImg = document.querySelector('.hero-img');
window.addEventListener('scroll', () => {
  if (window.scrollY < window.innerHeight) {
    heroImg.style.transform = `translateY(${window.scrollY * 0.25}px)`;
  }
});
document.querySelector('.hero').classList.add('loaded');

// ── Hamburger ────────────────────────────
const hamburger = document.getElementById('navHamburger');
const navLinks  = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ── Scroll reveal ────────────────────────
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

function observeReveal() {
  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
}
observeReveal();

// ── Dzongkhag overlay ────────────────────
let activeRegion = null;
const overlay   = document.getElementById('detailOverlay');
const backdrop  = document.getElementById('detailBackdrop');
const detailClose = document.getElementById('detailClose');

document.querySelectorAll('.dzong-card').forEach(card => {
  card.addEventListener('click', () => openDetail(card.dataset.dzong));
});

function openDetail(key) {
  const d = DZONGKHAGS[key];
  if (!d) return;
  activeRegion = d.name;

  document.getElementById('detailTag').textContent     = d.tag;
  document.getElementById('detailName').textContent    = d.name;
  document.getElementById('detailTagline').textContent = d.tagline;
  document.getElementById('detailHeroImg').style.backgroundImage = `url('${d.heroImg}')`;
  document.getElementById('detailHistory').textContent = d.history;
  document.getElementById('detailCtaName').textContent = d.name;

  // Gallery
  const gallery = document.getElementById('detailGallery');
  gallery.innerHTML = d.gallery.map(g =>
    `<div class="detail-gallery-img" style="background-image:url('${g.img}')" title="${g.caption}"></div>`
  ).join('');

  // Moments
  const momentsEl = document.getElementById('detailMoments');
  momentsEl.innerHTML = d.moments.map(m => `
    <div class="moment-card">
      <div class="moment-img" style="background-image:url('${m.img}')"></div>
      <div class="moment-text">
        <h4>${m.title}</h4>
        <p>${m.desc}</p>
      </div>
    </div>`).join('');

  // Show overlay
  document.getElementById('detailScroll').scrollTop = 0;
  backdrop.classList.add('open');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => overlay.classList.add('slide-in'));
}

function closeDetail() {
  overlay.classList.remove('slide-in');
  setTimeout(() => {
    overlay.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }, 450);
}

function enquireAbout() {
  closeDetail();
  setTimeout(() => {
    document.getElementById('enquire').scrollIntoView({ behavior: 'smooth' });
    const msgEl = document.querySelector('#enquireForm textarea');
    if (msgEl && activeRegion) {
      msgEl.value = `I'm interested in exploring ${activeRegion}. `;
      msgEl.focus();
    }
  }, 500);
}

detailClose.addEventListener('click', closeDetail);
backdrop.addEventListener('click', closeDetail);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetail(); });

// ── Enquire form ─────────────────────────
document.getElementById('enquireForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = document.getElementById('enquireBtn');
  const msg = document.getElementById('enquireMsg');
  const travel_dates = this.travel_dates?.value?.trim();

  btn.disabled = true; btn.textContent = 'Sending…';
  msg.className = 'form-msg'; msg.style.display = 'none';

  try {
    const res  = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:    this.name.value.trim(),
        email:   this.email.value.trim(),
        subject: travel_dates ? `Trip Enquiry, ${travel_dates}` : 'Trip Enquiry',
        message: this.message.value.trim(),
      })
    });
    const json = await res.json();
    if (res.ok) {
      msg.className = 'form-msg ok';
      msg.textContent = "Thank you. We will be in touch within 24 hours.";
      this.reset();
    } else {
      throw new Error(json.error);
    }
  } catch (ex) {
    msg.className = 'form-msg err';
    msg.textContent = ex.message || 'Something went wrong. Please try again.';
  } finally {
    btn.disabled = false; btn.textContent = 'Send Enquiry';
    msg.style.display = '';
  }
});

// ── Newsletter form ───────────────────────
document.getElementById('newsletterForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = document.getElementById('newsletterBtn');
  const msg = document.getElementById('newsletterMsg');

  btn.disabled = true; btn.textContent = 'Subscribing…';
  msg.className = 'form-msg'; msg.style.display = 'none';

  try {
    const res  = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:  this.name.value.trim(),
        email: this.email.value.trim(),
      })
    });
    const json = await res.json();
    if (res.ok) {
      msg.className = 'form-msg ok';
      msg.textContent = json.message;
      this.reset();
    } else {
      throw new Error(json.error);
    }
  } catch (ex) {
    msg.className = 'form-msg err';
    msg.textContent = ex.message || 'Something went wrong. Please try again.';
  } finally {
    btn.disabled = false; btn.textContent = 'Subscribe to the Dispatch';
    msg.style.display = '';
  }
});
