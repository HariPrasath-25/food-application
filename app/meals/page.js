import Link from "next/link";

export default function MealsPage() {
    return (
        <>
            <h1>Meals Page</h1>
            <p><Link href="/meals/sharemeal">Meals Share</Link></p>
        </>
    )
}