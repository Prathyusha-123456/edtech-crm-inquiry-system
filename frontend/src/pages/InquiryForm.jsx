import { useState } from 'react';
import { submitInquiry } from '../api.js';

const USER_TYPES = ['Parent', 'Student', 'School'];
const CATEGORIES = ['Scholarship', 'Concert', 'Admission', 'General Query'];
const EMPTY = { user_type: '', category: '', name: '', email: '', phone: '', message: '' };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[0-9\s\-()]{7,20}$/;

function validate(v) {
  const e = {};
  if (!v.user_type) e.user_type = 'Please select who you are';
  if (!v.category) e.category = 'Please select a category';
  if (v.name.trim().length < 2) e.name = 'Enter your name';
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email';
  if (!PHONE_RE.test(v.phone.trim())) e.phone = 'Enter a valid phone number';
  if (v.message.trim().length < 5) e.message = 'Message must be at least 5 characters';
  return e;
}

export default function InquiryForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await submitInquiry(values);
      setSuccess(true);
      setValues(EMPTY);
    } catch (err) {
      if (err.details) setErrors(err.details);
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <section className="card narrow center">
        <div className="tick">✓</div>
        <h2>Thank you!</h2>
        <p className="muted">Your inquiry has been received. Our team will get back to you soon.</p>
        <button className="btn" onClick={() => setSuccess(false)}>Submit another inquiry</button>
      </section>
    );
  }

  const Field = ({ label, name, children }) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {children}
      {errors[name] && <span className="error">{errors[name]}</span>}
    </div>
  );

  return (
    <section className="card narrow">
      <h1>Send us an inquiry</h1>
      <p className="muted">Tell us how we can help and we'll respond shortly.</p>

      <form onSubmit={onSubmit} noValidate>
        <div className="row">
          <Field label="I am a *" name="user_type">
            <select id="user_type" name="user_type" value={values.user_type} onChange={onChange}>
              <option value="">Select user type</option>
              {USER_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Category *" name="category">
            <select id="category" name="category" value={values.category} onChange={onChange}>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Full name *" name="name">
          <input id="name" name="name" value={values.name} onChange={onChange} placeholder="Your name" maxLength={120} />
        </Field>

        <div className="row">
          <Field label="Email *" name="email">
            <input id="email" name="email" type="email" value={values.email} onChange={onChange} placeholder="you@example.com" />
          </Field>
          <Field label="Phone number *" name="phone">
            <input id="phone" name="phone" type="tel" value={values.phone} onChange={onChange} placeholder="+91 98765 43210" />
          </Field>
        </div>

        <Field label="Message / Query *" name="message">
          <textarea id="message" name="message" rows={5} value={values.message} onChange={onChange} placeholder="Write your query here…" maxLength={2000} />
        </Field>

        {serverError && <div className="alert">{serverError}</div>}

        <button className="btn primary full" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit inquiry'}
        </button>
      </form>
    </section>
  );
}
