
import FooterSection from '@/components/footer';
import { Card } from '@/components/ui/card';
import { UserCircle } from 'lucide-react';

export default function ProfilePage() {
    return (
        <div className="min-h-screen bg-background pt-[120px]">
            <main className="pt-24 pb-20 container mx-auto px-6 max-w-3xl">
                <Card className="p-8 text-center flex flex-col items-center">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <UserCircle className="w-12 h-12 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Student Profile</h1>
                    <p className="text-muted-foreground mb-8">Manage your account settings and preferences.</p>
                    
                    <div className="p-6 bg-muted/50 rounded-xl w-full border border-dashed border-border/60">
                        <p className="text-sm text-muted-foreground font-medium">Profile settings module is coming soon in the next update.</p>
                    </div>
                </Card>
            </main>
            <FooterSection />
        </div>
    );
}
