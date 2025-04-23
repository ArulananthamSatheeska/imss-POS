import { useState, useEffect } from 'react';
import { X } from 'lucide-react'; // Use lucide-react for the close icon
import { CSSTransition } from 'react-transition-group';
import './CalculatorModal.css';

const CalculatorModal = ({ isOpen, onClose }) => {
    const [display, setDisplay] = useState('0');
    const [previousNumber, setPreviousNumber] = useState(null);
    const [operator, setOperator] = useState(null);
    const [isNewNumber, setIsNewNumber] = useState(true);
    const [error, setError] = useState(false);

    // Handle keyboard input
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            // Close calculator on Esc key
            if (e.key === 'Escape') {
                onClose();
                return;
            }

            // Handle number keys (0-9)
            if (/[0-9]/.test(e.key)) {
                handleNumber(e.key);
                return;
            }

            // Handle decimal point
            if (e.key === '.') {
                handleDecimal();
                return;
            }

            // Handle operators (+, -, *, /)
            if (['+', '-', '*', '/'].includes(e.key)) {
                handleOperator(e.key);
                return;
            }

            // Handle Enter key for calculation
            if (e.key === 'Enter' || e.key === '=') {
                calculate();
                return;
            }

            // Handle backspace
            if (e.key === 'Backspace') {
                backspace();
                return;
            }

            // Handle clear (C key)
            if (e.key === 'c' || e.key === 'C') {
                clear();
                return;
            }
        };

        // Add event listener for keyboard input
        window.addEventListener('keydown', handleKeyDown);

        // Cleanup event listener
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, display, previousNumber, operator]);

    // Handle number input
    const handleNumber = (number) => {
        if (error) return;
        if (isNewNumber) {
            setDisplay(number);
            setIsNewNumber(false);
        } else {
            setDisplay(display + number);
        }
    };

    // Handle decimal point
    const handleDecimal = () => {
        if (error) return;
        if (isNewNumber) {
            setDisplay('0.');
            setIsNewNumber(false);
        } else if (!display.includes('.')) {
            setDisplay(display + '.');
        }
    };

    // Handle operator input
    const handleOperator = (newOperator) => {
        if (error) return;
        setPreviousNumber(parseFloat(display));
        setOperator(newOperator);
        setIsNewNumber(true);
    };

    // Perform calculation
    const calculate = () => {
        if (error || !operator) return;

        try {
            const current = parseFloat(display);
            let result = 0;

            switch (operator) {
                case '+':
                    result = previousNumber + current;
                    break;
                case '-':
                    result = previousNumber - current;
                    break;
                case '*':
                    result = previousNumber * current;
                    break;
                case '/':
                    if (current === 0) throw new Error('Division by zero');
                    result = previousNumber / current;
                    break;
                default:
                    return;
            }

            setDisplay(result.toString());
            setPreviousNumber(null);
            setOperator(null);
            setIsNewNumber(true);
            setError(false);
        } catch (err) {
            setDisplay('Error');
            setError(true);
        }
    };

    // Clear the display
    const clear = () => {
        setDisplay('0');
        setPreviousNumber(null);
        setOperator(null);
        setIsNewNumber(true);
        setError(false);
    };

    // Handle backspace
    const backspace = () => {
        if (error) return;
        setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
    };

    return (
        <CSSTransition
            in={isOpen}
            timeout={300}
            classNames="modal"
            unmountOnExit
        >
            <div className="fixed  inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm z-50"
                onClick={onClose}>
                <div className="bg-cyan-950 dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-80 max-w-full transform transition-all relative"
                    onClick={(e) => e.stopPropagation()}>

                    {/* Close Button
                    <button
                        onClick={onClose}
                        className="absolute top-0 right-0 p-1  text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        title="Close Calculator"
                    >
                        <X size={20} />
                    </button> */}

                    {/* Display */}
                    <div className="mb-5">
                        <div className={`p-4 text-right rounded-xl text-3xl font-medium transition-colors
              ${error ? 'bg-red-100 text-red-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                            {display.length > 12 ? 'ERR' : display}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="grid grid-cols-4 gap-3">
                        <button onClick={clear} className="col-span-2 p-4 bg-red-500 text-white rounded-xl hover:bg-red-600 
              active:bg-red-700 transition-colors font-medium">
                            AC
                        </button>
                        <button onClick={backspace} className="p-4 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 
              active:bg-yellow-700 transition-colors">
                            ⌫
                        </button>
                        <button onClick={() => handleOperator('/')} className={`p-4 text-white rounded-xl transition-colors
              ${operator === '/' ? 'bg-blue-700' : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'}`}>
                            ÷
                        </button>

                        {[7, 8, 9].map((num) => (
                            <button key={num} onClick={() => handleNumber(num.toString())}
                                className="p-4 bg-gray-200 dark:bg-gray-600 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 
                  active:bg-gray-400 dark:active:bg-gray-400 transition-colors font-medium">
                                {num}
                            </button>
                        ))}
                        <button onClick={() => handleOperator('*')} className={`p-4 text-white rounded-xl transition-colors
              ${operator === '*' ? 'bg-blue-700' : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'}`}>
                            ×
                        </button>

                        {[4, 5, 6].map((num) => (
                            <button key={num} onClick={() => handleNumber(num.toString())}
                                className="p-4 bg-gray-200 dark:bg-gray-600 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 
                  active:bg-gray-400 dark:active:bg-gray-400 transition-colors font-medium">
                                {num}
                            </button>
                        ))}
                        <button onClick={() => handleOperator('-')} className={`p-4 text-white rounded-xl transition-colors
              ${operator === '-' ? 'bg-blue-700' : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'}`}>
                            -
                        </button>

                        {[1, 2, 3].map((num) => (
                            <button key={num} onClick={() => handleNumber(num.toString())}
                                className="p-4 bg-gray-200 dark:bg-gray-600 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 
                  active:bg-gray-400 dark:active:bg-gray-400 transition-colors font-medium">
                                {num}
                            </button>
                        ))}
                        <button onClick={() => handleOperator('+')} className={`p-4 text-white rounded-xl transition-colors
              ${operator === '+' ? 'bg-blue-700' : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'}`}>
                            +
                        </button>

                        <button onClick={() => handleNumber('0')}
                            className="col-span-2 p-4 bg-gray-200 dark:bg-gray-600 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 
                active:bg-gray-400 dark:active:bg-gray-400 transition-colors font-medium">
                            0
                        </button>
                        <button onClick={handleDecimal}
                            className="p-4 bg-gray-200 dark:bg-gray-600 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 
                active:bg-gray-400 dark:active:bg-gray-400 transition-colors font-medium">
                            .
                        </button>
                        <button onClick={calculate} className="p-4 bg-green-500 text-white rounded-xl hover:bg-green-600 
              active:bg-green-700 transition-colors">
                            =
                        </button>
                    </div>
                </div>
            </div>
        </CSSTransition>
    );
};

export default CalculatorModal;