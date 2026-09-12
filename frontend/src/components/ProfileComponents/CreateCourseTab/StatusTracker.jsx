import React from 'react';
import './StatusTracker.scss';

const STEP_LABELS = {
  draft: 'Nháp',
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
};

export default function StatusTracker({ status, rejectionReason }) {
  if (!status || status === 'draft') return null;

  const steps =
    status === 'rejected'
      ? ['draft', 'pending', 'rejected']
      : ['draft', 'pending', 'approved'];

  const currentIndex = steps.indexOf(status);

  return (
    <div className={`status-tracker status-tracker--${status}`}>
      <div className="status-tracker__steps">
        {steps.map((step, idx) => (
          <React.Fragment key={step}>
            <div
              className={
                'status-tracker__step' +
                (idx < currentIndex ? ' is-done' : '') +
                (idx === currentIndex ? ' is-active' : '')
              }
            >
              <span className="status-tracker__dot" />
              <span className="status-tracker__label">{STEP_LABELS[step]}</span>
            </div>
            {idx < steps.length - 1 && <span className="status-tracker__line" />}
          </React.Fragment>
        ))}
      </div>

      {status === 'pending' && (
        <p className="status-tracker__note status-tracker__note--pending">
          Khóa học đang chờ admin duyệt. Bạn vẫn có thể chỉnh sửa và gửi lại.
        </p>
      )}
      {status === 'approved' && (
        <p className="status-tracker__note status-tracker__note--approved">
          ✓ Khóa học đã được duyệt và đang hiển thị công khai.
        </p>
      )}
      {status === 'rejected' && (
        <p className="status-tracker__note status-tracker__note--rejected">
          ⚠ Khóa học bị từ chối{rejectionReason ? `: ${rejectionReason}` : '.'} Vui lòng chỉnh sửa và gửi lại.
        </p>
      )}
    </div>
  );
}