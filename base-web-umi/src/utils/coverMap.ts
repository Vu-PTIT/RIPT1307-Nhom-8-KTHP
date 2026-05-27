const staticMap: Record<string, string> = {
	'A Brief History of Time': '/covers/brief-history.jpg',
	'Lịch Sử Hội HọA': '/covers/lich-su-hoi-hoa.jpg',
	'Lịch Sử Hội Họa': '/covers/lich-su-hoi-hoa.jpg',
	'Nguồn Gốc Các Loài': '/covers/darwin.jpg',
	'Nguồn gốc các loài': '/covers/darwin.jpg',
	'Tắt Đèn': '/covers/tat-den.jpg',
	'Hệ Quản Trị Cơ Sở Dữ Liệu (DBMS)': '/covers/dbms.jpg',
	'Hệ quản trị cơ sở dữ liệu (DBMS)': '/covers/dbms.jpg',
	'Chúa tể những chiếc nhẫn': '/covers/s-l960.webp',
	'Cấu trúc dữ liệu và Giải thuật': '/covers/cau-truc-du-lieu.jpg',
	'Hệ quản trị cơ sở dữ liệu MongoDB': '/covers/dbms.jpg',
	'Kinh tế học hài hước': '/covers/sieukinhte-haihuoc.jpg',
	'Lập trình Python cơ bản': '/covers/python-for-beginners.jpg',
	'Số đồ': '/covers/so-do.jpg',
	'Lịch sử hội họa thế giới': '/covers/lich-su-hoi-hoa.jpg',
	'The Pragmatic Programmer': '/covers/pragmatic-programmer.jpg',
};

const extensions = ['.jpg', '.jpeg', '.webp', '.png'];

function normalize(s: string) {
	return s
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.replace(/[^a-z0-9 ]/g, '')
		.trim();
}

export function getCoverForTitle(title?: string) {
	if (!title) return '/default-cover.png';
	// direct lookup
	if (staticMap[title]) return staticMap[title];

	// try normalized keys
	const nTitle = normalize(title);
	for (const key of Object.keys(staticMap)) {
		if (normalize(key) === nTitle) return staticMap[key];
		// substring match
		if (nTitle.includes(normalize(key)) || normalize(key).includes(nTitle)) return staticMap[key];
	}

	// guess filename by slug
	const slug = nTitle.replace(/\s+/g, '-');
	for (const ext of extensions) {
		const candidate = `/covers/${slug}${ext}`;
		// return candidate — browser will 404 if not present, but commonly filenames match this pattern
		return candidate;
	}

	return '/default-cover.png';
}

export default getCoverForTitle;
