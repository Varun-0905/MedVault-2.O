import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { HeroHeader } from './header'
import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'

export default function HeroSection() {
    return (
        <>
            <HeroHeader />
            <main className="overflow-x-hidden">
                <section>
                    <div className="pb-24 pt-12 md:pb-32 lg:pb-56 lg:pt-44">
                        <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 lg:grid-cols-2 lg:items-center">
                            <div className="mx-auto max-w-lg text-center lg:ml-0 lg:text-left">
                                <h1
                                    className="mt-8 max-w-2xl text-balance text-5xl font-medium md:text-6xl lg:mt-16 xl:text-7xl">Mental Wellness for Every Student</h1>
                                <p className="mt-8 max-w-2xl text-pretty text-lg">Empowering higher education institutions with AI-driven mental health support, confidential counseling, and data-driven insights to foster student wellbeing.</p>

                                <div
                                    className="mt-12 flex flex-col items-center justify-center gap-2 sm:flex-row lg:justify-start">
                                    <Button asChild size="lg" className="px-5 text-base bg-green-600 hover:bg-green-700">
                                        <Link href="/anonymous-session">
                                            <span className="text-nowrap">Get Help Anonymously</span>
                                        </Link>
                                    </Button>
                                    <Button key={2} asChild size="lg" variant="ghost" className="px-5 text-base">
                                        <Link href="#psychoeducation">
                                            <span className="text-nowrap">Explore Psychoeducation</span>
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                            <div className="relative">
                                <Image
                                    className="w-full h-auto"
                                    src="/landing/generated-image.png"
                                    alt="Mental Health Support Illustration"
                                    height="4000"
                                    width="3000"
                                    priority />
                                <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/40 pointer-events-none"></div>
                                <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/30 pointer-events-none"></div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
