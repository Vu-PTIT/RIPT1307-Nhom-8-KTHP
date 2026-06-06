import React from 'react';
import { Pagination, PaginationProps } from 'antd';
import './index.less'; // We will create this or just rely on global styles

interface LibraryPaginationProps extends PaginationProps {
	/**
	 * If true, shows size changer and total.
	 * Default: false (simple pagination)
	 */
	complex?: boolean;
}

export default function LibraryPagination({
	complex = false,
	className,
	...props
}: LibraryPaginationProps) {
	const defaultProps: PaginationProps = complex
		? {
				showSizeChanger: true,
		  }
		: {
				showSizeChanger: false,
		  };

	return (
		<div className={`library-pagination-wrapper ${className || ''}`}>
			<Pagination {...defaultProps} {...props} />
		</div>
	);
}
