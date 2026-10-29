import { Fragment, useCallback, useEffect, useState } from 'react';
import { fetchInquiries, updateStatus } from '../api.js';

const USER_TYPES = ['Parent', 'Student', 'School'];
const CATEGORIES = ['Scholarship', 'Concert', 'Admission', 'General Query'];
const STATUSES = ['New', 'In Progress', 'Resolved'];

const fmtDate = (iso) =>
  new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

export default function Dashboard() {
  const [filters, setFilters] = useState({ category: '', user_type: '', status: '' });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ inquiries: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  // Debounce the search box
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await fetchInquiries({ ...filters, search, page, limit: 10 }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, search, page]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (key) => (e) => {
    setFilters((f) => ({ ...f, [key]: e.target.value }));
    setPage(1);
  };

  const clearAll = () => {
    setFilters({ category: '', user_type: '', status: '' });
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const changeStatus = async (id, status) => {
    const previous = data.inquiries;
    setData((d) => ({ ...d, inquiries: d.inquiries.map((i) => (i.id === id ? { ...i, status } : i)) }));
    try {
      await updateStatus(id, status);
    } catch (err) {
      setData((d) => ({ ...d, inquiries: previous }));
      setError(err.message);
    }
  };

  const { pagination } = data;
  const hasFilters = filters.category || filters.user_type || filters.status || searchInput;

  return (
    <section className="card wide">
      <div className="dash-head">
        <div>
          <h1>Inquiries</h1>
          <p className="muted">{pagination.total} total result{pagination.total === 1 ? '' : 's'}</p>
        </div>
      </div>

      <div className="filters">
        <input
          className="search"
          type="search"
          placeholder="Search by name or phone…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select value={filters.category} onChange={setFilter('category')} aria-label="Filter by category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={filters.user_type} onChange={setFilter('user_type')} aria-label="Filter by user type">
          <option value="">All user types</option>
          {USER_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={filters.status} onChange={setFilter('status')} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        {hasFilters && <button className="btn" onClick={clearAll}>Clear</button>}
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Phone</th><th>Email</th><th>User type</th>
              <th>Category</th><th>Date</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="center muted">Loading…</td></tr>}
            {!loading && data.inquiries.length === 0 && (
              <tr><td colSpan={7} className="center muted">No inquiries found.</td></tr>
            )}
            {!loading && data.inquiries.map((i) => (
              <Fragment key={i.id}>
                <tr className="clickable" onClick={() => setExpanded(expanded === i.id ? null : i.id)}>
                  <td>{i.name}</td>
                  <td>{i.phone}</td>
                  <td>{i.email}</td>
                  <td><span className="pill">{i.user_type}</span></td>
                  <td>{i.category}</td>
                  <td className="nowrap">{fmtDate(i.created_at)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      className={`status s-${i.status.replace(' ', '-').toLowerCase()}`}
                      value={i.status}
                      onChange={(e) => changeStatus(i.id, e.target.value)}
                      aria-label={`Status for ${i.name}`}
                    >
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
                {expanded === i.id && (
                  <tr className="msg-row">
                    <td colSpan={7}><strong>Message:</strong> {i.message}</td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        <button className="btn" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
      </div>
    </section>
  );
}
