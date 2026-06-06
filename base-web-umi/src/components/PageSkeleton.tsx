import React from 'react';
import { PageContainer } from '@ant-design/pro-layout';

const pageCopy: Record<string, string> = {
	'Danh sách tài liệu': 'Tìm sách, kiểm tra số bản còn lại và đưa vào giỏ mượn.',
	'Chi tiết tài liệu': 'Xem thông tin sách, tình trạng bản in và thao tác mượn nhanh.',
	'Danh sách yêu thích': 'Lưu các đầu sách quan tâm để chuyển sang giỏ mượn khi cần.',
	'Giỏ mượn sách': 'Rà soát đầu sách trước khi tạo phiếu mượn tại quầy checkout.',
	'Lịch sử mượn': 'Theo dõi phiếu mượn, hạn trả và trạng thái xử lý.',
	'Chi tiết phiếu mượn': 'Kiểm tra từng đầu sách trong phiếu và trạng thái trả.',
	'Yêu cầu gia hạn': 'Theo dõi các yêu cầu gia hạn và hạn trả mới.',
	'Check-in / Check-out': 'Ghi nhận lượt vào/ra thư viện phục vụ thống kê sử dụng.',
};

const PageSkeleton: React.FC<{ title: string; children?: React.ReactNode; subtitle?: string; extra?: React.ReactNode }> = ({
	title,
	children,
	subtitle,
	extra,
}) => {
	return (
		<PageContainer title={false} className='library-page-container' style={{ background: 'transparent' }}>
			<div className='library-page-shell'>
				<div className='library-page-header' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
					<div>
						<h1>{title}</h1>
						<p>{subtitle || pageCopy[title] || 'Khu vực nghiệp vụ thư viện mượn trả sách.'}</p>
					</div>
					{extra && <div>{extra}</div>}
				</div>
				<div className='library-page-content'>
					{children ? (
						children
					) : (
						<>
							Đây là trang <strong>{title}</strong>. Đang trong quá trình phát triển...
						</>
					)}
				</div>
			</div>
		</PageContainer>
	);
};

export default PageSkeleton;
