import { useState, useEffect } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, CheckCircle2, Circle, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTodos, createTodo, toggleTodo, deleteTodo } from '../services/todoService';

export default function CalendarModal({ isOpen, onClose }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [todos, setTodos] = useState([]);
    const [newTodoText, setNewTodoText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Initial fetch
    useEffect(() => {
        if (isOpen) {
            fetchRangeTodos();
        }
    }, [isOpen, currentMonth]);

    const fetchRangeTodos = async () => {
        setIsLoading(true);
        try {
            const start = startOfWeek(startOfMonth(currentMonth));
            const end = endOfWeek(endOfMonth(currentMonth));

            const res = await getTodos({
                rangeStart: start.toISOString(),
                rangeEnd: end.toISOString()
            });

            if (res.success) {
                setTodos(res.todos);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load tasks');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTodo = async (e) => {
        e.preventDefault();
        if (!newTodoText.trim()) return;

        try {
            const res = await createTodo(newTodoText, selectedDate);
            if (res.success) {
                setTodos([...todos, res.todo]);
                setNewTodoText('');
                toast.success('Task added');
            }
        } catch (error) {
            toast.error('Failed to add task');
        }
    };

    const handleToggleTodo = async (todoId) => {
        try {
            const res = await toggleTodo(todoId);
            if (res.success) {
                setTodos(todos.map(t => t._id === todoId ? { ...t, isCompleted: !t.isCompleted } : t));
            }
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const handleDeleteTodo = async (todoId) => {
        try {
            const res = await deleteTodo(todoId);
            if (res.success) {
                setTodos(todos.filter(t => t._id !== todoId));
                toast.success('Task deleted');
            }
        } catch (error) {
            toast.error('Failed to delete task');
        }
    };

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth)),
        end: endOfWeek(endOfMonth(currentMonth))
    });

    const selectedDateTodos = todos.filter(todo =>
        isSameDay(new Date(todo.dueDate), selectedDate)
    );

    const hasTodoOnDate = (date) => {
        return todos.some(todo => isSameDay(new Date(todo.dueDate), date) && !todo.isCompleted);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[600px] animate-in fade-in zoom-in-95 duration-200">

                {/* Left Side: Calendar */}
                <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {format(currentMonth, 'MMMM yyyy')}
                        </h2>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 mb-2 text-center">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                            <div key={day} className="text-xs font-semibold text-gray-400 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 flex-1">
                        {days.map((day, dayIdx) => {
                            const isSelected = isSameDay(day, selectedDate);
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isTodayDate = isToday(day);
                            const hasTasks = hasTodoOnDate(day);

                            return (
                                <button
                                    key={day.toString()}
                                    onClick={() => setSelectedDate(day)}
                                    className={`
                                        relative flex flex-col items-center justify-center rounded-xl py-3 transition-all
                                        ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-700' : 'text-gray-700 dark:text-gray-200'}
                                        ${isSelected ? 'bg-indigo-600 text-white shadow-md scale-105' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                                        ${isTodayDate && !isSelected ? 'text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-900/20' : ''}
                                    `}
                                >
                                    <span className="text-sm">{format(day, 'd')}</span>
                                    {hasTasks && (
                                        <span className={`mt-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Side: Todos */}
                <div className="w-full md:w-1/2 p-6 flex flex-col bg-white dark:bg-gray-900">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMM d')}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {selectedDateTodos.length} tasks
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Todo List */}
                    <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2 scrollbar-thin">
                        {selectedDateTodos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                                <CalendarIcon className="w-12 h-12 mb-3 opacity-20" />
                                <p>No tasks for this day</p>
                                <p className="text-xs mt-1 opacity-70">Click below to add one</p>
                            </div>
                        ) : (
                            selectedDateTodos.map(todo => (
                                <div
                                    key={todo._id}
                                    className="group flex items-center p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-indigo-100 dark:hover:border-indigo-900 hover:shadow-sm bg-gray-50 dark:bg-gray-800/50 transition-all"
                                >
                                    <button
                                        onClick={() => handleToggleTodo(todo._id)}
                                        className={`mr-3 transition-colors ${todo.isCompleted ? 'text-green-500' : 'text-gray-400 hover:text-indigo-500'}`}
                                    >
                                        {todo.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                    </button>
                                    <span className={`flex-1 text-sm ${todo.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {todo.text}
                                    </span>
                                    <button
                                        onClick={() => handleDeleteTodo(todo._id)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add Todo Input */}
                    <form onSubmit={handleAddTodo} className="mt-auto">
                        <div className="relative">
                            <input
                                type="text"
                                value={newTodoText}
                                onChange={(e) => setNewTodoText(e.target.value)}
                                placeholder="Add a task..."
                                className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-gray-400 dark:text-gray-200"
                            />
                            <button
                                type="submit"
                                disabled={!newTodoText.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
