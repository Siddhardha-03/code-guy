import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSheets } from '../services/sheetsService';

const Sheets = () => {
	const [sheets, setSheets] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		const loadSheets = async () => {
			setLoading(true);
			setError('');
			try {
				const data = await getSheets();
				setSheets(data || []);
			} catch (err) {
				setError('Failed to load sheets. Please try again.');
				console.error('Sheets load error:', err);
			} finally {
				setLoading(false);
			}
		};

		loadSheets();
	}, []);

	return (
		<div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 text-gray-900 dark:text-gray-100">
			<div className="flex items-start sm:items-center justify-between gap-3 mb-8">
				<div>
					<h1 className="text-3xl font-bold mb-2">Learning Paths</h1>
					<p className="text-lg text-gray-700 dark:text-gray-300">
						Curated problem sets to master topics with structured progression.
					</p>
				</div>
			</div>

			{loading && (
				<div className="text-center py-10">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
					<p className="text-gray-600 dark:text-gray-400 mt-4">Loading sheets...</p>
				</div>
			)}

			{error && !loading && (
				<div className="text-center py-6 text-red-600 dark:text-red-400">{error}</div>
			)}

			{!loading && !error && sheets.length === 0 && (
				<div className="text-center py-10 text-gray-600 dark:text-gray-300">No sheets available yet.</div>
			)}

			{!loading && !error && sheets.length > 0 && (
				<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{sheets.map((sheet, idx) => (
						<Link
							key={sheet.id || idx}
							to={`/practice/sheets/${sheet.id}`}
							className="card-premium animate-shine group"
							style={{ animationDelay: `${idx * 0.08}s` }}
						>
							<div className="flex items-start justify-between mb-3">
								<h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors line-clamp-2">
									{sheet.title || 'Untitled Sheet'}
								</h3>
								<span
									className={`ml-2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 ${
										sheet.difficulty_level === 'easy'
											? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200'
											: sheet.difficulty_level === 'medium'
											? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200'
											: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'
									}`}
								>
									{(sheet.difficulty_level || 'mixed').toUpperCase()}
								</span>
							</div>
							<p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-2">
								{sheet.description || 'A curated path to practice key problems.'}
							</p>
							<div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 pt-3">
								<div className="flex gap-4">
									<span className="font-semibold text-gray-900 dark:text-gray-100">📚 {sheet.total_problems ?? '—'}</span>
									{sheet.estimated_hours && (
										<span className="font-semibold text-gray-900 dark:text-gray-100">⏱️ {sheet.estimated_hours}h</span>
									)}
								</div>
								<span className="text-blue-600 dark:text-blue-300 font-bold group-hover:translate-x-1 transition-transform">→</span>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
};

export default Sheets;
