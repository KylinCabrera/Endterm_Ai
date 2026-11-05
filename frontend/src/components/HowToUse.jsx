const STEPS = [
  {
    number: '01',
    title: 'Create your account',
    text: 'Sign up or sign in so your grocery cart is saved to you.',
  },
  {
    number: '02',
    title: 'Add a label photo',
    text: 'Upload a clear photo of the nutrition facts panel, or use your camera. JPEG, PNG, or WebP up to 10 MB.',
  },
  {
    number: '03',
    title: 'Check what it says',
    text: 'Review the values per serving and fix the item name if the reader got it wrong.',
  },
  {
    number: '04',
    title: 'Keep it in your cart',
    text: 'Add the item to your cart. Set a calorie limit in your profile to get a heads-up as you shop.',
  },
]

export default function HowToUse() {
  return (
    <section className="max-w-6xl mx-auto px-6 pb-16 md:pb-24">
      <div className="pt-12 border-t border-[#e6e3d3]">
        <p className="text-[11px] tracking-widest font-semibold text-[#4a5e52]">HOW IT WORKS</p>
        <h2
          className="mt-4 font-serif font-bold text-4xl md:text-5xl leading-[1] text-[#1a3a2c]"
          style={{ letterSpacing: '-0.03em' }}
        >
          Four small steps,
          <br />
          <span className="italic text-[#066b4c]">no learning curve.</span>
        </h2>

        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <li
              key={step.number}
              className="rounded-2xl border border-[#e6e3d3] bg-[#fdfcf7] p-6"
            >
              <span className="font-serif text-3xl font-bold text-[#066b4c]">{step.number}</span>
              <h3 className="mt-4 text-sm font-bold text-[#1a3a2c]">{step.title}</h3>
              <p className="mt-2 text-xs text-[#6e8275] leading-relaxed">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}