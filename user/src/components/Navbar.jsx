import { useState, useEffect } from 'react'
import { assets } from '../assets/assets'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, Menu, X } from 'lucide-react';
import { useClerk, UserButton, useUser } from '@clerk/clerk-react';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useUser();
    const { openSignIn } = useClerk();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Handle scroll effect for glassmorphism
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Tools', href: '#tools' },
        { name: 'Community', href: '/ai/community' },
        { name: 'Pricing', href: '#pricing' },
    ];

    const handleNavClick = (href) => {
        setIsMenuOpen(false);
        if (href.startsWith('#')) {
            if (location.pathname !== '/') {
                navigate('/');
                // Small delay to allow navigation to complete before scrolling
                setTimeout(() => {
                    const element = document.getElementById(href.substring(1));
                    element?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } else {
                const element = document.getElementById(href.substring(1));
                element?.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            navigate(href);
        }
    };

    return (
        <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md py-3 shadow-sm' : 'bg-transparent py-5'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer transition-transform hover:scale-105" onClick={() => navigate('/')}>
                        <img src={assets.newlogo} alt="Logo" className='w-32 sm:w-28' />
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-10">
                        {navLinks.map((link) => (
                            <button
                                key={link.name}
                                onClick={() => handleNavClick(link.href)}
                                className="text-gray-600 hover:text-primary font-medium transition-colors cursor-pointer text-sm lg:text-base relative group"
                            >
                                {link.name}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                            </button>
                        ))}
                    </div>

                    {/* CTA / User Profile */}
                    <div className="hidden md:flex items-center gap-5">
                        {user ? (
                            <div className="flex items-center gap-6">
                                <button 
                                    onClick={() => navigate('/ai')}
                                    className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors cursor-pointer"
                                >
                                    Dashboard
                                </button>
                                <div className="scale-110">
                                    <UserButton afterSignOutUrl="/" />
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={openSignIn}
                                className="group flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-7 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm hover:shadow-lg hover:shadow-primary/20 cursor-pointer"
                            >
                                Get Started 
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-600 hover:text-primary p-2 transition-colors cursor-pointer rounded-lg hover:bg-gray-100"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div className={`md:hidden absolute top-full left-0 w-full bg-white transition-all duration-300 ease-in-out shadow-xl overflow-hidden ${isMenuOpen ? 'max-h-screen opacity-100 border-b border-gray-100' : 'max-h-0 opacity-0 border-none'}`}>
                <div className="px-6 py-8 space-y-4 flex flex-col items-center">
                    {navLinks.map((link) => (
                        <button
                            key={link.name}
                            onClick={() => handleNavClick(link.href)}
                            className="block w-full text-center py-4 text-lg font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
                        >
                            {link.name}
                        </button>
                    ))}
                    <div className="pt-6 w-full flex flex-col items-center gap-6 border-t border-gray-100 mt-4">
                        {user ? (
                             <div className="flex flex-col items-center gap-4 w-full">
                                <button 
                                    onClick={() => navigate('/ai')}
                                    className="text-lg font-medium text-gray-700 hover:text-primary py-2 cursor-pointer"
                                >
                                    Dashboard
                                </button>
                                <UserButton afterSignOutUrl="/" />
                             </div>
                        ) : (
                            <button
                                onClick={openSignIn}
                                className="w-full flex justify-center items-center gap-3 bg-primary text-white px-6 py-4 rounded-xl text-lg font-semibold shadow-lg shadow-primary/20 transition-all cursor-pointer"
                            >
                                Get Started <ArrowRight className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
