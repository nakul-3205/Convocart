const STYLES = {
  pending: 'bg-ochre-soft text-ochre',
  paid: 'bg-pine-soft text-pine',
  failed: 'bg-brick-soft text-brick',
  expired: 'bg-line text-muted',
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || STYLES.expired;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${style}`}>
      {status}
    </span>
  );
}
