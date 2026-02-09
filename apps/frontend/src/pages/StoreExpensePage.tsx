import { useState } from 'react';
import {
    useStoreExpenses,
    useCreateStoreExpense,
    useUpdateStoreExpense,
    useDeleteStoreExpense,
    useTotalExpenses,
} from '../hooks/useStoreExpense';
import { formatCurrency } from '../utils/currency';

export default function StoreExpensePage() {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);

    const { data: expenses, isLoading } = useStoreExpenses();
    const { data: totalExpenses } = useTotalExpenses();
    const createExpense = useCreateStoreExpense();
    const updateExpense = useUpdateStoreExpense();
    const deleteExpense = useDeleteStoreExpense();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || !description) {
            alert('Please fill in amount and description');
            return;
        }

        try {
            if (editingId) {
                await updateExpense.mutateAsync({
                    id: editingId,
                    data: {
                        amount: parseFloat(amount),
                        description,
                        category: category || undefined,
                    },
                });
                alert('Expense updated successfully!');
            } else {
                await createExpense.mutateAsync({
                    amount: parseFloat(amount),
                    description,
                    category: category || undefined,
                });
                alert('Expense created successfully!');
            }

            // Reset form
            setAmount('');
            setDescription('');
            setCategory('');
            setEditingId(null);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to save expense');
        }
    };

    const handleEdit = (expense: any) => {
        setEditingId(expense.id);
        setAmount(expense.amount.toString());
        setDescription(expense.description);
        setCategory(expense.category || '');
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this expense?')) {
            return;
        }

        try {
            await deleteExpense.mutateAsync(id);
            alert('Expense deleted successfully!');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to delete expense');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setAmount('');
        setDescription('');
        setCategory('');
    };

    if (isLoading) {
        return <div className="spinner"></div>;
    }

    return (
        <div>
            <h1>🏪 Store Expenses</h1>

            {/* Total Expenses Card */}
            <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.9 }}>Total Active Expenses</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>
                    {formatCurrency(totalExpenses || 0)}
                </p>
            </div>

            {/* Add/Edit Expense Form */}
            <div className="card mb-4">
                <h2 className="mb-4">{editingId ? '✏️ Edit Expense' : '➕ Add New Expense'}</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                        <div className="form-group">
                            <label className="form-label">Amount (Rp) *</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                step="0.01"
                                min="0"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., Monthly rent, Utilities"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., Rent, Utilities"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={createExpense.isPending || updateExpense.isPending}
                            >
                                {editingId ? 'Update' : 'Add'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleCancelEdit}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            {/* Expenses List */}
            <div className="card">
                <h2 className="mb-4">📋 Expense List</h2>
                {expenses && expenses.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((expense) => (
                                    <tr key={expense.id}>
                                        <td>{new Date(expense.createdAt).toLocaleString()}</td>
                                        <td>{expense.description}</td>
                                        <td>
                                            {expense.category ? (
                                                <span className="badge badge-info">{expense.category}</span>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                        <td className="text-danger">{formatCurrency(expense.amount)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handleEdit(expense)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDelete(expense.id)}
                                                    disabled={deleteExpense.isPending}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-muted">No expenses yet. Add your first expense above.</p>
                )}
            </div>
        </div>
    );
}
