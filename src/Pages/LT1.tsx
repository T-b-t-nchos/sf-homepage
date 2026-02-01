import { useRef } from "react";
import Button from "../Components/ui/Button";
import Badge from "../Components/ui/Badge";
import Section from "../Components/layout/Section";

export default function LT1() {
    const cfpRef = useRef<HTMLDivElement | null>(null);
    const DISCORD_INVITE_URL = "https://discord.gg/sf-kosen";

    return (
        <>
            <div className="bg-white">
                <div className="relative isolate pt-14">
                    <div className="py-24 sm:py-32 lg:pb-40">
                        <div className="mx-auto max-w-7xl px-6 lg:px-8">
                            <div className="lg:grid lg:grid-cols-2 lg:gap-x-16 lg:items-center">
                                <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
                                    <Badge label="イベント開催予告" />
                                    <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                                        好きを、語ろう。
                                    </h1>
                                    <p className="mt-6 text-lg leading-8 text-gray-600">
                                        Discord開催｜参加者・LT登壇者募集中
                                    </p>
                                    <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
                                        <Button variant="primary" to="/events/lt-1/register">
                                            登壇登録
                                        </Button>
                                        <Button variant="secondary" href={DISCORD_INVITE_URL}>
                                            Discord参加
                                        </Button>
                                    </div>
                                    <p className="mt-6 text-xs text-gray-500">
                                        正式名称：好きを語ろう！湘南藤沢高専LT会！！
                                    </p>
                                </div>
                                <div className="mt-16 lg:mt-0">
                                    <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
                                        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
                                            {import.meta.env.VITE_YOUTUBE_PR_VIDEO_URL ? (
                                                <div className="aspect-video w-full overflow-hidden rounded-xl shadow-sm ring-1 ring-gray-200">
                                                    <iframe
                                                        className="h-full w-full"
                                                        src={import.meta.env.VITE_YOUTUBE_PR_VIDEO_URL}
                                                        title="PR動画"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                        allowFullScreen
                                                    />
                                                </div>
                                            ) : (
                                                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        Discord開催（オンライン）
                                                    </p>
                                                    <p className="mt-2 text-sm leading-6 text-gray-600">
                                                        当日は開始5分前からチェックインできます。
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Section
                    id="about"
                    title="開催概要"
                    description="目的・対象・形式（Discord）をコンパクトにまとめます。"
                >
                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-gray-200 p-6">
                            <h3 className="text-sm font-semibold">テーマ「情熱を語れ」</h3>
                            <p className="mt-2 text-sm leading-6 text-gray-600">
                                情熱をもって取り組んでいることを熱く語ってほしい！初学者にもわかるように、かつ自分の好きなモノの魅力を伝えよう。
                            </p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 p-6">
                            <h3 className="text-sm font-semibold">こんな人におすすめ</h3>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                                <li>人の「好き」を聞きたい（聴講のみも歓迎）</li>
                                <li>ライトに登壇してみたい</li>
                                <li>技術・制作の刺激が欲しい</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-6">
                        <h3 className="text-sm font-semibold font-mono">景品</h3>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                            <li>登壇者から抽選で <span className="font-medium">Discord Nitro</span> をプレゼント！</li>
                            <li>学生会長選出の優秀発表者には <span className="font-medium">「教員」ロール</span> を付与！</li>
                        </ul>
                    </div>
                </Section>

                <div ref={cfpRef} className="scroll-mt-20" />
                <Section
                    id="cfp"
                    title="LT募集（CFP）"
                    description="あなたの「好き」を語ってみませんか？ 初心者も大歓迎です！"
                >
                    <div className="rounded-2xl border border-gray-200 p-6">
                        <div className="grid gap-4 lg:grid-cols-2">
                            <div>
                                <h3 className="text-sm font-semibold">募集概要</h3>
                                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                                    <li>テーマ：「情熱を語れ」（フリー）</li>
                                    <li>持ち時間：<span className="font-medium">7分</span>（発表5分＋質疑2分）</li>
                                    <li>形式：Discord（画面共有）</li>
                                    <li>初学者にもわかるように語ろう！</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">応募</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    応募フォームに「タイトル・概要・連絡先」などを入力してください。
                                </p>
                                <div className="mt-4">
                                    <Button variant="secondary" to="/events/lt-1/register">
                                        参加登録（LT応募もこちら）
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Section>

                <Section id="timetable" title="タイムテーブル（暫定）">
                    <div className="overflow-hidden rounded-2xl border border-gray-200">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="px-4 py-3">時間</th>
                                    <th className="px-4 py-3">内容</th>
                                    <th className="px-4 py-3">所要</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                <tr>
                                    <td className="px-4 py-3">19:30</td>
                                    <td className="px-4 py-3">オープニング・挨拶</td>
                                    <td className="px-4 py-3">5分</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">19:35</td>
                                    <td className="px-4 py-3">プログラム確認</td>
                                    <td className="px-4 py-3">5分</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">19:40</td>
                                    <td className="px-4 py-3">LT発表 前半（5組）</td>
                                    <td className="px-4 py-3">35分</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">20:15</td>
                                    <td className="px-4 py-3 text-gray-500">休憩（司会交代）</td>
                                    <td className="px-4 py-3">10分</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">20:25</td>
                                    <td className="px-4 py-3">LT発表 後半（5組）</td>
                                    <td className="px-4 py-3">35分</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">21:00</td>
                                    <td className="px-4 py-3">総括・クロージング</td>
                                    <td className="px-4 py-3">10分</td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td className="px-4 py-3">21:10〜</td>
                                    <td className="px-4 py-3">任意交流会</td>
                                    <td className="px-4 py-3">自由</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-3 text-xs text-gray-500">※ 開催日時：2/22 19:30〜</p>
                </Section>

                <Section id="join" title="参加方法（Discord）">
                    <div className="grid gap-4 lg:grid-cols-3">
                        {[
                            { t: "1. 参加登録", d: "登録フォームから参加・LT応募のエントリーをします。" },
                            { t: "2. Discord参加", d: "完了画面のリンク等から、Discordサーバーに参加します。" },
                            { t: "3. 当日参加", d: "開始時間にイベント用ボイスチャンネルに接続します。" },
                        ].map((x) => (
                            <div key={x.t} className="rounded-2xl border border-gray-200 p-6">
                                <h3 className="text-sm font-semibold">{x.t}</h3>
                                <p className="mt-2 text-sm leading-6 text-gray-600">{x.d}</p>
                            </div>
                        ))}
                    </div>
                </Section>

                <Section id="faq" title="FAQ">
                    <div className="rounded-2xl border border-gray-200 p-6">
                        <ul className="space-y-4 text-sm text-gray-600">
                            <li>
                                <span className="font-medium text-gray-900">Q.</span> 聴講のみの参加もOK？
                                <br />
                                <span className="font-medium text-gray-900">A.</span> もちろん歓迎です！途中退出も自由です。
                            </li>
                            <li>
                                <span className="font-medium text-gray-900">Q.</span> 初心者でも登壇できますか？
                                <br />
                                <span className="font-medium text-gray-900">A.</span> 大歓迎！初学者にもわかるように語るのがテーマです。
                            </li>
                            <li>
                                <span className="font-medium text-gray-900">Q.</span> 発表中のルールは？
                                <br />
                                <span className="font-medium text-gray-900">A.</span> 登壇者以外はミュートをお願いします。質疑応答で発言できます。
                            </li>
                            <li>
                                <span className="font-medium text-gray-900">Q.</span> 録画はありますか？
                                <br />
                                <span className="font-medium text-gray-900">A.</span> ポリシーに従い、必要に応じて案内します。
                            </li>
                        </ul>
                    </div>
                </Section>

                <footer className="border-t border-gray-200 py-10">
                    <div className="mx-auto max-w-6xl px-4 text-sm text-gray-600">
                        <div className="font-medium text-gray-900">
                            好きを語ろう！湘南藤沢高専LT会！！
                        </div>
                        <p className="mt-2">主催：LT会運営</p>
                    </div>
                </footer>
            </div >
        </>
    );
}
