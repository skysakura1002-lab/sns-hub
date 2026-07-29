import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: '投稿',
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          title: 'テンプレート',
        }}
      />
    </Tabs>
  )
}
