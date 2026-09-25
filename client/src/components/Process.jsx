const STEPS = [
  { title: 'Pick a service', text: 'Choose the cleaning type, size, and date that works for you.' },
  { title: 'Confirm the address', text: 'We match you with a cleaner working in your area.' },
  { title: 'Cleaner arrives', text: 'You get the cleaner\u2019s name and arrival time by message.' },
  { title: 'Pay after the job', text: 'Pay by card or cash once the cleaning is done.' },
];

export default function Process() {
  return (
    <section className="section process" id="process">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">How it works</span>
          <h2>From quote to clean in four steps</h2>
        </div>
        <div className="steps">
          {STEPS.map((step, i) => (
            <div className="step" key={step.title}>
              <div className="step-num">{i + 1}</div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
