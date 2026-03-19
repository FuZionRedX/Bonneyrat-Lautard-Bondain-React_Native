import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const LOREM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non purus id velit finibus lacinia. Curabitur id mattis augue. Nulla facilisi. Integer pulvinar varius justo, sed cursus erat egestas non. Cras volutpat, felis id iaculis tempor, sem eros congue augue, sed iaculis justo lacus vitae nibh. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum congue dignissim risus, non tristique odio posuere et. Aenean id urna et magna dapibus bibendum. Duis vulputate, dui in facilisis ornare, neque neque interdum mi, et congue mauris sapien in nibh. Curabitur pulvinar orci sit amet turpis blandit, vitae posuere nibh viverra. Suspendisse potenti. Aliquam erat volutpat.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla eget sem id urna hendrerit tristique. Vestibulum ut quam sapien. Nam ac pulvinar elit. Sed non orci feugiat, ultrices libero id, tincidunt justo. Maecenas luctus auctor urna, vitae viverra est dictum quis. Mauris tristique nulla et est vulputate, sed viverra est volutpat.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi dictum lobortis velit, vitae scelerisque sem tincidunt non. Donec in ullamcorper urna. Integer in diam eget neque fermentum scelerisque. Pellentesque sagittis, ex ac ullamcorper tristique, est nisl tincidunt nisl, in ultricies lacus mauris vel sem. Vivamus in feugiat nisi. Etiam suscipit augue vel lectus pretium, et convallis orci consequat.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque ornare, arcu eu malesuada feugiat, augue nibh convallis orci, at efficitur turpis mauris et odio. Fusce placerat eros sed commodo posuere. Praesent bibendum, justo et congue suscipit, dui turpis eleifend sem, et pulvinar arcu justo et leo. Integer blandit massa in ligula pretium, ut dignissim dui malesuada.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed convallis laoreet sem, in euismod justo posuere non. Integer in consequat ipsum. Donec sed massa ut metus convallis ultrices. Nam volutpat porttitor nibh, in pellentesque lorem pellentesque nec. Ut in aliquam mi. In suscipit purus et hendrerit luctus. Nulla pellentesque ipsum ac lorem tristique, ac suscipit ipsum iaculis.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non purus id velit finibus lacinia. Curabitur id mattis augue. Nulla facilisi. Integer pulvinar varius justo, sed cursus erat egestas non. Cras volutpat, felis id iaculis tempor, sem eros congue augue, sed iaculis justo lacus vitae nibh. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum congue dignissim risus, non tristique odio posuere et. Aenean id urna et magna dapibus bibendum. Duis vulputate, dui in facilisis ornare, neque neque interdum mi, et congue mauris sapien in nibh. Curabitur pulvinar orci sit amet turpis blandit, vitae posuere nibh viverra. Suspendisse potenti. Aliquam erat volutpat.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla eget sem id urna hendrerit tristique. Vestibulum ut quam sapien. Nam ac pulvinar elit. Sed non orci feugiat, ultrices libero id, tincidunt justo. Maecenas luctus auctor urna, vitae viverra est dictum quis. Mauris tristique nulla et est vulputate, sed viverra est volutpat.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi dictum lobortis velit, vitae scelerisque sem tincidunt non. Donec in ullamcorper urna. Integer in diam eget neque fermentum scelerisque. Pellentesque sagittis, ex ac ullamcorper tristique, est nisl tincidunt nisl, in ultricies lacus mauris vel sem. Vivamus in feugiat nisi. Etiam suscipit augue vel lectus pretium, et convallis orci consequat.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque ornare, arcu eu malesuada feugiat, augue nibh convallis orci, at efficitur turpis mauris et odio. Fusce placerat eros sed commodo posuere. Praesent bibendum, justo et congue suscipit, dui turpis eleifend sem, et pulvinar arcu justo et leo. Integer blandit massa in ligula pretium, ut dignissim dui malesuada.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed convallis laoreet sem, in euismod justo posuere non. Integer in consequat ipsum. Donec sed massa ut metus convallis ultrices. Nam volutpat porttitor nibh, in pellentesque lorem pellentesque nec. Ut in aliquam mi. In suscipit purus et hendrerit luctus. Nulla pellentesque ipsum ac lorem tristique, ac suscipit ipsum iaculis.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non purus id velit finibus lacinia. Curabitur id mattis augue. Nulla facilisi. Integer pulvinar varius justo, sed cursus erat egestas non. Cras volutpat, felis id iaculis tempor, sem eros congue augue, sed iaculis justo lacus vitae nibh. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum congue dignissim risus, non tristique odio posuere et. Aenean id urna et magna dapibus bibendum. Duis vulputate, dui in facilisis ornare, neque neque interdum mi, et congue mauris sapien in nibh. Curabitur pulvinar orci sit amet turpis blandit, vitae posuere nibh viverra. Suspendisse potenti. Aliquam erat volutpat.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla eget sem id urna hendrerit tristique. Vestibulum ut quam sapien. Nam ac pulvinar elit. Sed non orci feugiat, ultrices libero id, tincidunt justo. Maecenas luctus auctor urna, vitae viverra est dictum quis. Mauris tristique nulla et est vulputate, sed viverra est volutpat.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi dictum lobortis velit, vitae scelerisque sem tincidunt non. Donec in ullamcorper urna. Integer in diam eget neque fermentum scelerisque. Pellentesque sagittis, ex ac ullamcorper tristique, est nisl tincidunt nisl, in ultricies lacus mauris vel sem. Vivamus in feugiat nisi. Etiam suscipit augue vel lectus pretium, et convallis orci consequat.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque ornare, arcu eu malesuada feugiat, augue nibh convallis orci, at efficitur turpis mauris et odio. Fusce placerat eros sed commodo posuere. Praesent bibendum, justo et congue suscipit, dui turpis eleifend sem, et pulvinar arcu justo et leo. Integer blandit massa in ligula pretium, ut dignissim dui malesuada.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed convallis laoreet sem, in euismod justo posuere non. Integer in consequat ipsum. Donec sed massa ut metus convallis ultrices. Nam volutpat porttitor nibh, in pellentesque lorem pellentesque nec. Ut in aliquam mi. In suscipit purus et hendrerit luctus. Nulla pellentesque ipsum ac lorem tristique, ac suscipit ipsum iaculis.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non purus id velit finibus lacinia. Curabitur id mattis augue. Nulla facilisi. Integer pulvinar varius justo, sed cursus erat egestas non. Cras volutpat, felis id iaculis tempor, sem eros congue augue, sed iaculis justo lacus vitae nibh. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum congue dignissim risus, non tristique odio posuere et. Aenean id urna et magna dapibus bibendum. Duis vulputate, dui in facilisis ornare, neque neque interdum mi, et congue mauris sapien in nibh. Curabitur pulvinar ntm orci sit amet turpis blandit, vitae posuere nibh viverra. Suspendisse potenti. Aliquam erat volutpat.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla eget sem id urna hendrerit tristique. Vestibulum ut quam sapien. Nam ac pulvinar elit. Sed non orci feugiat, ultrices libero id, tincidunt justo. Maecenas luctus auctor urna, vitae viverra est dictum quis. Mauris tristique nulla et est vulputate, sed viverra est volutpat.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi dictum lobortis velit, vitae scelerisque sem tincidunt non. Donec in ullamcorper urna. Integer in diam eget neque fermentum scelerisque. Pellentesque sagittis, ex ac ullamcorper tristique, est nisl tincidunt nisl, in ultricies lacus mauris vel sem. Vivamus in feugiat nisi. Etiam suscipit augue vel lectus pretium, et convallis orci consequat.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque ornare, arcu eu malesuada feugiat, augue nibh convallis orci, at efficitur turpis mauris et odio. Fusce placerat eros sed commodo posuere. Praesent bibendum, justo et congue suscipit, dui turpis eleifend sem, et pulvinar arcu justo et leo. Integer blandit massa in ligula pretium, ut dignissim dui malesuada.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed convallis laoreet sem, in euismod justo posuere non. Integer in consequat ipsum. Donec sed massa ut metus convallis ultrices. Nam volutpat porttitor nibh, in pellentesque lorem pellentesque nec. Ut in aliquam mi. In suscipit purus et hendrerit luctus. Nulla pellentesque ipsum ac lorem tristique, ac suscipit ipsum iaculis.`;

export default function LegalScreen() {
  const params = useLocalSearchParams<{ title?: string }>();
  const title = params.title ?? "Legal";

  return (
    <>
      <Stack.Screen options={{ title: String(title) }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{String(title)}</Text>
          <Text style={styles.body}>{LOREM}</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: "#374151",
  },
});
