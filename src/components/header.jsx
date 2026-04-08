'use client'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import React from 'react'

const menuItems = [
    { name: 'Psychoeducation Hub', href: '#psychoeducation' },
]

export const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [user, setUser] = React.useState(null)
    const [isLoading, setIsLoading] = React.useState(true)

    // Check authentication status on component mount
    React.useEffect(() => {
        checkAuthStatus()
    }, [])

    const checkAuthStatus = async () => {
        try {
            const response = await fetch('/api/users/me')
            const data = await response.json()
            if (data.user) {
                setUser(data.user)
            }
        } catch (error) {
            console.error('Error checking auth status:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const getDashboardLink = () => {
        if (!user) return '/login'
        return user.role === 'admin' ? '/admin' : '/dashboard'
    }

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/users/logout', {
                method: 'POST',
            });
            
            if (response.ok) {
                // Clear user state and redirect to home
                setUser(null);
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className="bg-background/50 fixed z-20 w-full border-b backdrop-blur-3xl">
                <div className="mx-auto max-w-6xl px-6 transition-all duration-300">
                    <div
                        className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
                            <Link href="/" aria-label="home" className="flex items-center space-x-2">
                                <Logo />
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Menu
                                    className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X
                                    className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>

                            <div className="hidden lg:block">
                                <ul className="flex gap-8 text-sm">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                    {user && user.role !== 'admin' && (
                                        <>
                                            <li>
                                                <Link
                                                    href="/peer-forum"
                                                    className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                                    <span>Peer Forum</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    href="/mood-assessment"
                                                    className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                                    <span>Mood Assessment</span>
                                                </Link>
                                            </li>
                                        </>
                                    )}
                                    {user && (
                                        <li>
                                            <Link
                                                href={getDashboardLink()}
                                                className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                                <span>Dashboard</span>
                                            </Link>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        <div
                            className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                            <div className="lg:hidden">
                                <ul className="space-y-6 text-base">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                    {user && user.role !== 'admin' && (
                                        <>
                                            <li>
                                                <Link
                                                    href="/peer-forum"
                                                    className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                                    <span>Peer Forum</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    href="/mood-assessment"
                                                    className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                                    <span>Mood Assessment</span>
                                                </Link>
                                            </li>
                                        </>
                                    )}
                                    {user && (
                                        <li>
                                            <Link
                                                href={getDashboardLink()}
                                                className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                                <span>Dashboard</span>
                                            </Link>
                                        </li>
                                    )}
                                </ul>
                            </div>
                            <div
                                className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                                <ThemeToggle />
                                {!isLoading && (
                                    user ? (
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={handleLogout}
                                        >
                                            <span>Logout</span>
                                        </Button>
                                    ) : (
                                        <>
                                            <Button asChild variant="outline" size="sm">
                                                <Link href="/login">
                                                    <span>Login</span>
                                                </Link>
                                            </Button>
                                            <Button asChild size="sm">
                                                <Link href="/register">
                                                    <span>Sign Up</span>
                                                </Link>
                                            </Button>
                                        </>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
}
